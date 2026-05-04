import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data: supervisors } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('role', 'supervisor')
		.order('created_at', { ascending: false });

	const { data: counts } = await locals.supabase
		.from('student_supervisor_assignments')
		.select('supervisor_id');
	const tally = new Map<string, number>();
	for (const r of counts ?? []) tally.set(r.supervisor_id, (tally.get(r.supervisor_id) ?? 0) + 1);

	return {
		supervisors: (supervisors ?? []).map((s) => ({ ...s, student_count: tally.get(s.id) ?? 0 }))
	};
};
