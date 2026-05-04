import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail, redirect } from '@sveltejs/kit';
import { loadArticleForStudent } from '$lib/server/queries/articles';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = requireRole(locals, 'student');
	const { article, feedback } = await loadArticleForStudent(locals.supabase, user.id, 2);
	return { article, feedback };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'student');
		const fd = await request.formData();
		const { error } = await locals.supabase
			.from('articles')
			.update({ title: String(fd.get('title') ?? ''), draft: String(fd.get('draft') ?? '') })
			.eq('student_id', user.id)
			.eq('article_number', 2);
		if (error) return fail(400, { error: error.message });
		return { saved: true };
	},
	submit: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'student');
		const fd = await request.formData();
		const { error } = await locals.supabase
			.from('articles')
			.update({
				title: String(fd.get('title') ?? ''),
				draft: String(fd.get('draft') ?? ''),
				status: 'submitted',
				submitted_at: new Date().toISOString()
			})
			.eq('student_id', user.id)
			.eq('article_number', 2);
		if (error) return fail(400, { error: error.message });
		throw redirect(303, '/student');
	}
};
