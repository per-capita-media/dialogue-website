import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const [{ data: students }, { data: supervisors }, { data: assignments }] = await Promise.all([
		locals.supabase.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name'),
		locals.supabase.from('profiles').select('id, full_name, email').eq('role', 'supervisor').order('full_name'),
		locals.supabase
			.from('student_supervisor_assignments')
			.select('id, student_id, supervisor_id, assigned_at')
	]);
	return {
		students: students ?? [],
		supervisors: supervisors ?? [],
		assignments: assignments ?? []
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
	promote: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const profile_id = String(fd.get('profile_id') ?? '');
		const new_role = String(fd.get('new_role') ?? '');
		if (!['student', 'supervisor', 'admin'].includes(new_role)) return fail(400, { error: 'Bad role' });
		const { error } = await supabaseAdmin
			.from('profiles')
			.update({ role: new_role })
			.eq('id', profile_id);
		if (error) return fail(400, { error: error.message });
		await logAudit({ actorId: user.id, action: 'change_role', targetId: profile_id, payload: { new_role } });
		return { ok: true };
	}
};
