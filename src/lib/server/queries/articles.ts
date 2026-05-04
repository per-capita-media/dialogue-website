import type { SupabaseClient } from '@supabase/supabase-js';
import type { Article, ArticleFeedback, Profile } from '$lib/types/domain';

export async function loadArticleForStudent(
	supabase: SupabaseClient,
	studentId: string,
	articleNumber: 1 | 2
) {
	const { data: article } = await supabase
		.from('articles')
		.select('*')
		.eq('student_id', studentId)
		.eq('article_number', articleNumber)
		.maybeSingle<Article>();

	let feedback: (ArticleFeedback & { author?: Pick<Profile, 'full_name' | 'role'> })[] = [];
	if (article) {
		const { data: rows } = await supabase
			.from('article_feedback')
			.select('*, author:profiles!article_feedback_author_id_fkey(full_name, role)')
			.eq('article_id', article.id)
			.order('created_at', { ascending: true });
		feedback = (rows ?? []) as any;
	}
	return { article, feedback };
}
