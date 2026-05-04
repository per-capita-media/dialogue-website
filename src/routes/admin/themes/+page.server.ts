import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail } from '@sveltejs/kit';
import { ALL_THEMES } from '$lib/constants/themes';
import { logAudit } from '$lib/server/audit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data: students } = await locals.supabase
		.from('profiles')
		.select('id, full_name, email')
		.eq('role', 'student')
		.order('full_name');

	const { data: themes } = await locals.supabase.from('student_themes').select('*');
	const map: Record<string, string[]> = {};
	for (const t of themes ?? []) {
		(map[t.student_id] ??= []).push(t.theme as string);
	}
	return { students: students ?? [], themesByStudent: map, all: ALL_THEMES };
};

export const actions: Actions = {
	override: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const studentId = String(fd.get('student_id') ?? '');
		const themes = fd.getAll('themes').map(String);
		if (!studentId || themes.length !== 2) return fail(400, { error: 'Pick exactly 2 themes' });

		// Replace student's themes in a single transaction-like sequence using
		// service role (bypasses the lock check trigger).
		await supabaseAdmin.from('student_themes').delete().eq('student_id', studentId);
		const { error } = await supabaseAdmin
			.from('student_themes')
			.insert(themes.map((theme) => ({ student_id: studentId, theme })));
		if (error) return fail(400, { error: error.message });

		await logAudit({
			actorId: user.id,
			action: 'override_themes',
			targetTable: 'student_themes',
			targetId: studentId,
			payload: { themes }
		});
		return { ok: true };
	}
};
