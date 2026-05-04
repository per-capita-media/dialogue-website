import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import type { StudentStage } from '$lib/types/domain';

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = requireRole(locals, ['teacher', 'admin']);

	let rows: any[] = [];
	if (profile.role === 'teacher') {
		const { data: links } = await locals.supabase
			.from('teacher_student_links')
			.select('student:profiles!teacher_student_links_student_id_fkey(id, full_name, email, school_name, year_group, teacher_name, teacher_email, current_stage, created_at)')
			.eq('teacher_id', profile.id);
		rows = (links ?? []).map((r: any) => r.student).filter(Boolean);
	} else {
		const { data: students } = await locals.supabase
			.from('profiles')
			.select('id, full_name, email, school_name, year_group, teacher_name, teacher_email, current_stage, created_at')
			.eq('role', 'student')
			.order('full_name');
		rows = students ?? [];
	}

	const stageCounts: Partial<Record<StudentStage, number>> = {};
	for (const student of rows) {
		const stage = student.current_stage as StudentStage;
		stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
	}

	const schools = new Set(rows.map((s) => s.school_name).filter(Boolean));

	return {
		students: rows.sort((a, b) => (a.full_name ?? a.email ?? '').localeCompare(b.full_name ?? b.email ?? '')),
		stageCounts,
		schoolCount: schools.size
	};
};
