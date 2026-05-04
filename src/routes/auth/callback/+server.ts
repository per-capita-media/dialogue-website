/**
 * OAuth / email-confirmation callback. Supabase Auth redirects here with a
 * `code` query param after the user clicks an emailed link or completes an
 * OAuth flow. We exchange the code for a session (which sets cookies) and
 * then redirect to the dashboard router.
 */
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/onboarding/profile';

	if (code) {
		await locals.supabase.auth.exchangeCodeForSession(code);
	}
	throw redirect(303, next);
};
