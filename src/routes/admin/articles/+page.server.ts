import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data } = await locals.supabase
		.from('articles')
		.select('*, student:profiles!articles_student_id_fkey(full_name, email)')
		.order('updated_at', { ascending: false });
	return { articles: data ?? [] };
};
