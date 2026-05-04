import { requireRole } from '$lib/server/guards';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { profile } = requireRole(locals, ['supervisor', 'admin']);
	return { profile };
};
