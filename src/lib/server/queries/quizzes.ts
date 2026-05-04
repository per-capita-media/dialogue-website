import type { SupabaseClient } from '@supabase/supabase-js';
import type { MaterialType, Quiz, QuizQuestion } from '$lib/types/domain';
import { supabaseAdmin } from '../supabase-admin';

/** Fetch the active quiz of a given type plus its questions WITHOUT correct_index. */
export async function loadActiveQuizForType(supabase: SupabaseClient, type: MaterialType) {
	const { data: quiz } = await supabase
		.from('quizzes')
		.select('*')
		.eq('type', type)
		.eq('active', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle<Quiz>();
	if (!quiz) return { quiz: null, questions: [] as QuizQuestion[] };

	const { data: questions } = await supabase
		.from('quiz_questions_public')
		.select('id, quiz_id, prompt, options, order_index')
		.eq('quiz_id', quiz.id)
		.order('order_index');
	return { quiz, questions: (questions ?? []) as QuizQuestion[] };
}

/** Server-side score: pull correct_index via service role, compare to answers. */
export async function scoreQuiz(quizId: string, answers: Record<string, number>) {
	const { data: questions, error } = await supabaseAdmin
		.from('quiz_questions')
		.select('id, correct_index')
		.eq('quiz_id', quizId);
	if (error || !questions) throw error ?? new Error('No questions');
	const total = questions.length || 1;
	let correct = 0;
	for (const q of questions) if (answers[q.id] === q.correct_index) correct += 1;
	return { score: Math.round((correct / total) * 100), total, correct };
}
