import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireRole(locals, 'admin');
	const [{ data: quiz }, { data: questions }] = await Promise.all([
		locals.supabase.from('quizzes').select('*').eq('id', params.id).maybeSingle(),
		locals.supabase
			.from('quiz_questions')
			.select('*')
			.eq('quiz_id', params.id)
			.order('order_index')
	]);
	if (!quiz) throw error(404, 'Not found');
	return { quiz, questions: questions ?? [] };
};

export const actions: Actions = {
	updateQuiz: async ({ request, locals, params }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const { error } = await locals.supabase
			.from('quizzes')
			.update({
				title: String(fd.get('title') ?? ''),
				pass_threshold: Number(fd.get('pass_threshold') ?? 70),
				active: fd.get('active') === 'on'
			})
			.eq('id', params.id);
		if (error) return fail(400, { error: error.message });
		return { ok: true };
	},
	addQuestion: async ({ request, locals, params }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const prompt = String(fd.get('prompt') ?? '').trim();
		const optionsRaw = String(fd.get('options') ?? '');
		const correct_index = Number(fd.get('correct_index') ?? -1);
		const options = optionsRaw.split('\n').map((s) => s.trim()).filter(Boolean);
		if (!prompt || options.length < 2) return fail(400, { error: 'Need a prompt and at least 2 options' });
		if (correct_index < 0 || correct_index >= options.length)
			return fail(400, { error: 'correct_index out of range' });
		const { data: max } = await locals.supabase
			.from('quiz_questions')
			.select('order_index')
			.eq('quiz_id', params.id)
			.order('order_index', { ascending: false })
			.limit(1)
			.maybeSingle();
		const order_index = (max?.order_index ?? -1) + 1;
		const { error } = await locals.supabase
			.from('quiz_questions')
			.insert({ quiz_id: params.id, prompt, options, correct_index, order_index });
		if (error) return fail(400, { error: error.message });
		return { ok: true };
	},
	deleteQuestion: async ({ request, locals }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('quiz_questions').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { ok: true };
	}
};
