import type { LayoutServerLoad } from './$types';

/** Surface user + profile to every page. Cheap because hooks already loaded them. */
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user,
		profile: locals.profile
	};
};
