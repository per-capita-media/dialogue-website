import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data } = await locals.supabase
		.from('pitches')
		.select('*, student:profiles!pitches_student_id_fkey(full_name, email)')
		.order('created_at', { ascending: false });
	return { pitches: data ?? [] };
};
