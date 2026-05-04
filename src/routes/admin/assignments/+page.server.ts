import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const [{ data: students }, { data: editors }, { data: teachers }, { data: staff }, { data: assignments }, { data: teacherLinks }] = await Promise.all([
		locals.supabase.from('profiles').select('id, full_name, email, role').eq('role', 'student').order('full_name'),
		locals.supabase.from('profiles').select('id, full_name, email, role').in('role', ['supervisor', 'editor']).order('full_name'),
		locals.supabase.from('profiles').select('id, full_name, email, role').eq('role', 'teacher').order('full_name'),
		locals.supabase.from('profiles').select('id, full_name, email, role').in('role', ['teacher', 'supervisor', 'editor', 'admin']).order('full_name'),
		locals.supabase
			.from('student_supervisor_assignments')
			.select('id, student_id, supervisor_id, assigned_at'),
		locals.supabase
			.from('teacher_student_links')
			.select('id, teacher_id, student_id, assigned_at')
	]);
	return {
		students: students ?? [],
		editors: editors ?? [],
		teachers: teachers ?? [],
		staff: staff ?? [],
		assignments: assignments ?? [],
		teacherLinks: teacherLinks ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const student_id = String(fd.get('student_id') ?? '');
		const supervisor_id = String(fd.get('supervisor_id') ?? '');
		if (!student_id || !supervisor_id) return fail(400, { error: 'Missing fields' });
		const { error } = await locals.supabase
			.from('student_supervisor_assignments')
			.insert({ student_id, supervisor_id, assigned_by: user.id });
		if (error) return fail(400, { error: error.message });
		await logAudit({ actorId: user.id, action: 'assign_supervisor', payload: { student_id, supervisor_id } });
		return { ok: true };
	},
	remove: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('student_supervisor_assignments').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		await logAudit({ actorId: user.id, action: 'unassign_supervisor', payload: { id } });
		return { ok: true };
	},
	assignTeacher: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const student_id = String(fd.get('student_id') ?? '');
		const teacher_id = String(fd.get('teacher_id') ?? '');
		if (!student_id || !teacher_id) return fail(400, { error: 'Missing fields' });
		const { error } = await locals.supabase
			.from('teacher_student_links')
			.insert({ student_id, teacher_id, assigned_by: user.id });
		if (error) return fail(400, { error: error.message });
		await logAudit({ actorId: user.id, action: 'assign_teacher', payload: { student_id, teacher_id } });
		return { ok: true };
	},
	removeTeacher: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('teacher_student_links').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		await logAudit({ actorId: user.id, action: 'unassign_teacher', payload: { id } });
		return { ok: true };
	},
	promote: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const profile_id = String(fd.get('profile_id') ?? '');
		const new_role = String(fd.get('new_role') ?? '');
		if (!['student', 'teacher', 'supervisor', 'editor', 'admin'].includes(new_role)) {
			return fail(400, { error: 'Bad role' });
		}
		const { data: current } = await supabaseAdmin
			.from('profiles')
			.select('id, email, full_name')
			.eq('id', profile_id)
			.maybeSingle();
		if (!current) return fail(404, { error: 'Profile not found' });
		const { error } = await supabaseAdmin.rpc('bootstrap_profile', {
			p_id: current.id,
			p_email: current.email,
			p_full_name: current.full_name,
			p_role: new_role,
			p_onboarding_complete: new_role !== 'student'
		});
		if (error) return fail(400, { error: error.message });
		await logAudit({ actorId: user.id, action: 'change_role', targetId: profile_id, payload: { new_role } });
		return { ok: true };
	}
};
