import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data } = await locals.supabase
		.from('audit_log')
		.select('*, actor:profiles!audit_log_actor_id_fkey(full_name, role)')
		.order('created_at', { ascending: false })
		.limit(200);
	return { rows: data ?? [] };
};
