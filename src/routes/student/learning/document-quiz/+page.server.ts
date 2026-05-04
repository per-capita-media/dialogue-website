import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { loadActiveQuizForType, scoreQuiz } from '$lib/server/queries/quizzes';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'student');
	const { quiz, questions } = await loadActiveQuizForType(locals.supabase, 'document');
	return { quiz, questions };
};

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'student');
		const fd = await request.formData();
		const quizId = String(fd.get('quiz_id') ?? '');
		let answers: Record<string, number> = {};
		try {
			answers = JSON.parse(String(fd.get('answers') ?? '{}'));
		} catch {
			return fail(400, { error: 'Bad answer payload' });
		}
		if (!quizId) return fail(400, { error: 'Missing quiz id' });

		const { data: quiz } = await locals.supabase
			.from('quizzes')
			.select('id, pass_threshold')
			.eq('id', quizId)
			.maybeSingle();
		if (!quiz) return fail(404, { error: 'Quiz not found' });

		const { score } = await scoreQuiz(quizId, answers);
		const passed = score >= quiz.pass_threshold;

		const { error } = await locals.supabase.from('quiz_attempts').insert({
			student_id: user.id,
			quiz_id: quizId,
			answers,
			score,
			passed
		});
		if (error) return fail(500, { error: error.message });

		return { score, passed };
	}
};
