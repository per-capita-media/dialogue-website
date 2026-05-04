import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import type { StudentStage } from '$lib/types/domain';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = requireRole(locals, ['supervisor', 'admin']);
	const sb = locals.supabase;

	// 1. Pull the assignments + the joined student profile in one round trip.
	const { data: assignmentRows } = await sb
		.from('student_supervisor_assignments')
		.select(
			`student_id,
			 student:profiles!student_supervisor_assignments_student_id_fkey(
			   id, full_name, email, school_name, current_stage
			 )`
		)
		.eq('supervisor_id', user.id);

	const students = (assignmentRows ?? [])
		.map((r: any) => r.student)
		.filter((s: any) => s);

	const studentIds = students.map((s: any) => s.id as string);

	// 2. Pending action queues scoped to those students.
	let pitchSelectStudents: { id: string; full_name: string | null }[] = [];
	let articleReviewItems: {
		article_id: string;
		article_number: number;
		student_id: string;
		student_name: string | null;
		status: string;
	}[] = [];
	let article2Ready: { article_id: string; student_id: string; student_name: string | null }[] = [];

	if (studentIds.length > 0) {
		// Students who have submitted ≥ 5 pitches but no pitch is yet selected.
		const { data: submittedPerStudent } = await sb
			.from('pitches')
			.select('student_id, status')
			.in('student_id', studentIds)
			.in('status', ['submitted', 'selected', 'rejected']);
		const tally = new Map<string, { submitted: number; selected: number }>();
		for (const p of submittedPerStudent ?? []) {
			const t = tally.get(p.student_id) ?? { submitted: 0, selected: 0 };
			t.submitted += 1;
			if (p.status === 'selected') t.selected += 1;
			tally.set(p.student_id, t);
		}
		pitchSelectStudents = students
			.filter((s: any) => {
				const t = tally.get(s.id);
				return t && t.submitted >= 5 && t.selected === 0;
			})
			.map((s: any) => ({ id: s.id, full_name: s.full_name }));

		// Articles awaiting feedback + Article 2 ready to unlock.
		const { data: artRows } = await sb
			.from('articles')
			.select('id, article_number, status, student_id, locked')
			.in('student_id', studentIds);
		for (const a of artRows ?? []) {
			const sName = students.find((s: any) => s.id === a.student_id)?.full_name ?? null;
			if (a.status === 'submitted' || a.status === 'under_review') {
				articleReviewItems.push({
					article_id: a.id,
					article_number: a.article_number,
					student_id: a.student_id,
					student_name: sName,
					status: a.status
				});
			}
			// Article 2 locked + Article 1 approved → ready to unlock.
			if (a.article_number === 2 && a.locked) {
				const a1 = (artRows ?? []).find(
					(x: any) => x.student_id === a.student_id && x.article_number === 1
				);
				if (a1?.status === 'approved') {
					article2Ready.push({ article_id: a.id, student_id: a.student_id, student_name: sName });
				}
			}
		}
	}

	// 3. Unread inbound messages count.
	const { count: unreadCount } = await sb
		.from('messages')
		.select('id', { count: 'exact', head: true })
		.is('read_at', null)
		.neq('sender_id', user.id);

	// 4. Stage distribution across assigned students.
	const stageCounts: Partial<Record<StudentStage, number>> = {};
	for (const s of students) {
		const k = (s as { current_stage: StudentStage }).current_stage;
		stageCounts[k] = (stageCounts[k] ?? 0) + 1;
	}

	return {
		students,
		queue: {
			pitchSelectStudents,
			articleReviewItems,
			article2Ready
		},
		unreadCount: unreadCount ?? 0,
		stageCounts
	};
};
