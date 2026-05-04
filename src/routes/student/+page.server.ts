import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, profile } = requireUser(locals);

	const [themesRes, pitchesRes, articlesRes, attemptsRes] = await Promise.all([
		locals.supabase.from('student_themes').select('theme').eq('student_id', user.id),
		locals.supabase
			.from('pitches')
			.select('id, slot_index, theme, title, status, article_number')
			.eq('student_id', user.id)
			.order('slot_index'),
		locals.supabase
			.from('articles')
			.select('id, article_number, status, locked')
			.eq('student_id', user.id)
			.order('article_number'),
		locals.supabase
			.from('quiz_attempts')
			.select('quiz_id, passed, attempted_at, quizzes(type)')
			.eq('student_id', user.id)
			.order('attempted_at', { ascending: false })
	]);

	const themes = (themesRes.data ?? []).map((r) => r.theme);
	const pitches = pitchesRes.data ?? [];
	const articles = articlesRes.data ?? [];
	const attempts = attemptsRes.data ?? [];

	const docPassed = attempts.some((a: any) => a.quizzes?.type === 'document' && a.passed);
	const webPassed = attempts.some((a: any) => a.quizzes?.type === 'webinar' && a.passed);

	return {
		profile,
		themes,
		pitches,
		articles,
		docPassed,
		webPassed
	};
};
