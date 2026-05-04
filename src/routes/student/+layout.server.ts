import { requireRole, requireOnboardingComplete } from '$lib/server/guards';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireRole(locals, 'student');
	const { profile } = requireOnboardingComplete(locals);
	return { profile };
};
