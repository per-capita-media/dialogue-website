import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import { redirectIfAuthed } from '$lib/server/guards';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals }) => {
	redirectIfAuthed(locals);
	return {};
};

const SignupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8, 'At least 8 characters')
});

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = Object.fromEntries(await request.formData());
		const parsed = SignupSchema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { email: form.email, error: parsed.error.errors[0].message });
		}
		const { email, password } = parsed.data;

		// Sign up using the user-scoped client so cookies are set.
		const { data, error: signUpError } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (signUpError) {
			return fail(400, { email, error: signUpError.message });
		}

		if (data.user) {
			// Insert the matching profile row using the service-role client so we
			// can bypass RLS (the user may not be confirmed yet, so their JWT isn't
			// usable for inserts via RLS).
			await supabaseAdmin.from('profiles').upsert(
				{
					id: data.user.id,
					email,
					role: 'student' // signups are always students
				},
				{ onConflict: 'id' }
			);
		}

		// If email confirmation is required, the session is null. Show a notice.
		if (!data.session) {
			return { sent: true, email };
		}

		// Otherwise, signed in — go to onboarding.
		throw redirect(303, '/onboarding/profile');
	}
};
