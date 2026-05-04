import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('role', 'student')
		.order('created_at', { ascending: false });
	return { students: data ?? [] };
};
