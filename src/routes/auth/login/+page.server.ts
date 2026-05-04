import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { redirectIfAuthed, dashboardForRole } from '$lib/server/guards';

function authErrorMessage(message: string) {
	return message === 'fetch failed' || message === '{}'
		? 'Unable to reach the authentication service. Please try again shortly.'
		: message;
}

export const load: PageServerLoad = async ({ locals }) => {
	redirectIfAuthed(locals);
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = Object.fromEntries(await request.formData());
		const email = String(form.email ?? '');
		const password = String(form.password ?? '');

		const { error } = await locals.supabase.auth
			.signInWithPassword({ email, password })
			.catch(() => ({ error: { message: 'Unable to reach the authentication service. Please try again shortly.' } }));
		if (error) {
			return fail(400, { email, error: authErrorMessage(error.message) });
		}

		// Re-fetch profile to know where to send them.
		const { data: { user } } = await locals.supabase.auth.getUser();
		if (!user) return fail(500, { email, error: 'Sign-in succeeded but user is missing' });

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, onboarding_complete')
			.eq('id', user.id)
			.maybeSingle();
		if (!profile) throw redirect(303, '/onboarding/profile');

		if (profile.role === 'student' && !profile.onboarding_complete) {
			throw redirect(303, '/onboarding/profile');
		}
		throw redirect(303, dashboardForRole(profile.role));
	}
};
