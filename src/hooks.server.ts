/**
 * SvelteKit server hook.
 *
 * 1. Builds a per-request Supabase client that uses the user's auth cookie,
 *    so all queries are RLS-scoped to that user.
 * 2. Resolves the current session, the auth user, and the application
 *    `profile` row, attaching all three to `event.locals` for downstream
 *    `+page.server.ts` files and form actions.
 * 3. The `filterSerializedResponseHeaders` callback tells SvelteKit to forward
 *    the `content-range` header to the client (Supabase needs this for some
 *    range requests).
 */
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import type { Profile } from '$lib/types/domain';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// Validate the JWT against Supabase Auth on every request. `getUser()`
	// hits the Auth server (no trust on the cookie alone). `getSession()`
	// returns whatever's in the cookie without revalidating, which is fine
	// once we know the user is real.
	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();

	if (user) {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		event.locals.session = session;
		event.locals.user = user;

		// Fetch the application profile (role, onboarding flags, stage).
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.maybeSingle<Profile>();
		event.locals.profile = profile ?? null;
	} else {
		event.locals.session = null;
		event.locals.user = null;
		event.locals.profile = null;
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range'
	});
};
