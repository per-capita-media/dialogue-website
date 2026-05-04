import type { PageServerLoad } from './$types';
import { requireRole, assertSupervisesStudent } from '$lib/server/guards';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireRole(locals, ['supervisor', 'admin']);
	await assertSupervisesStudent(locals, params.id);

	const [{ data: profile }, { data: themes }, { data: pitches }, { data: articles }] =
		await Promise.all([
			locals.supabase.from('profiles').select('*').eq('id', params.id).maybeSingle(),
			locals.supabase.from('student_themes').select('theme').eq('student_id', params.id),
			locals.supabase.from('pitches').select('*').eq('student_id', params.id).order('slot_index'),
			locals.supabase.from('articles').select('*').eq('student_id', params.id).order('article_number')
		]);

	if (!profile) throw error(404, 'Student not found');
	return {
		student: profile,
		themes: (themes ?? []).map((t) => t.theme),
		pitches: pitches ?? [],
		articles: articles ?? []
	};
};
