import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import type { StudentStage } from '$lib/types/domain';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');

	const sb = locals.supabase;

	// ── Headline counts ──────────────────────────────────────────────
	const [
		studentsCount,
		supervisorsCount,
		pitchesCount,
		articlesCount,
		attemptsCount,
		// Setup status (for getting-started checklist)
		docMatCount,
		webMatCount,
		docQuizCount,
		webQuizCount,
		// Action queue counts
		pendingPitchSelectCount,
		pendingArticleReviewCount,
		article2LockedCount,
		// Recent + distribution data
		stageRows,
		recentSignups,
		recentAudit
	] = await Promise.all([
		sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
		sb.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['supervisor', 'editor']),
		sb.from('pitches').select('id', { count: 'exact', head: true }),
		sb.from('articles').select('id', { count: 'exact', head: true }),
		sb.from('quiz_attempts').select('id', { count: 'exact', head: true }),

		sb.from('learning_materials').select('id', { count: 'exact', head: true }).eq('type', 'document').eq('active', true),
		sb.from('learning_materials').select('id', { count: 'exact', head: true }).eq('type', 'webinar').eq('active', true),
		sb.from('quizzes').select('id', { count: 'exact', head: true }).eq('type', 'document').eq('active', true),
		sb.from('quizzes').select('id', { count: 'exact', head: true }).eq('type', 'webinar').eq('active', true),

		// Pitch selections waiting: any student who has 5 submitted pitches but
		// no pitch with status='selected'. Approximate via pitches.status='submitted'.
		sb.from('pitches').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
		// Articles waiting on supervisor feedback (submitted or under_review).
		sb.from('articles').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
		// Article 2s still locked AFTER article 1 is approved.
		sb
			.from('articles')
			.select('id', { count: 'exact', head: true })
			.eq('article_number', 2)
			.eq('locked', true),

		// Stage distribution across all students.
		sb.from('profiles').select('current_stage').eq('role', 'student'),

		// Recent signups (5).
		sb
			.from('profiles')
			.select('id, full_name, email, role, created_at')
			.order('created_at', { ascending: false })
			.limit(5),

		// Recent audit events (5).
		sb
			.from('audit_log')
			.select('id, action, target_table, created_at, actor:profiles!audit_log_actor_id_fkey(full_name)')
			.order('created_at', { ascending: false })
			.limit(5)
	]);

	// Tally stage distribution.
	const stageCounts: Partial<Record<StudentStage, number>> = {};
	for (const row of stageRows.data ?? []) {
		const s = (row as { current_stage: StudentStage }).current_stage;
		stageCounts[s] = (stageCounts[s] ?? 0) + 1;
	}

	const recentAuditRows = (recentAudit.data ?? []).map((row) => {
		const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
		return {
			...row,
			actor: actor ?? null
		};
	});

	return {
		stats: {
			students: studentsCount.count ?? 0,
			supervisors: supervisorsCount.count ?? 0,
			pitches: pitchesCount.count ?? 0,
			articles: articlesCount.count ?? 0,
			attempts: attemptsCount.count ?? 0
		},
		setup: {
			hasDocMaterial: (docMatCount.count ?? 0) > 0,
			hasWebMaterial: (webMatCount.count ?? 0) > 0,
			hasDocQuiz: (docQuizCount.count ?? 0) > 0,
			hasWebQuiz: (webQuizCount.count ?? 0) > 0,
			hasSupervisor: (supervisorsCount.count ?? 0) > 0,
			hasStudent: (studentsCount.count ?? 0) > 0
		},
		queue: {
			pendingPitchSelect: pendingPitchSelectCount.count ?? 0,
			pendingArticleReview: pendingArticleReviewCount.count ?? 0,
			article2Locked: article2LockedCount.count ?? 0
		},
		stageCounts,
		recentSignups: recentSignups.data ?? [],
		recentAudit: recentAuditRows
	};
};
