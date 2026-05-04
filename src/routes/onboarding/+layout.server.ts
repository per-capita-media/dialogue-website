import type { LayoutServerLoad } from './$types';
import { requireUser, dashboardForRole } from '$lib/server/guards';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { profile } = requireUser(locals);
	// Only students go through onboarding. Supervisors/admins skip ahead.
	if (profile.role !== 'student') throw redirect(303, dashboardForRole(profile.role));
	if (profile.onboarding_complete) throw redirect(303, '/student');
	return { profile };
};
