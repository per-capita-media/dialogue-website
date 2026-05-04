import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { listConversationsFor, getOrCreateConversation } from '$lib/server/queries/conversations';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = requireRole(locals, ['supervisor', 'editor', 'admin']);
	const conversations = await listConversationsFor(locals.supabase, user.id);

	const { data: assigned } = await locals.supabase
		.from('student_supervisor_assignments')
		.select('student:profiles!student_supervisor_assignments_student_id_fkey(id, full_name)')
		.eq('supervisor_id', user.id);
	const students = (assigned ?? []).map((r: any) => r.student);

	const { data: admins } = await locals.supabase.from('profiles').select('id, full_name').eq('role', 'admin');

	return { conversations, students, admins: admins ?? [] };
};

export const actions: Actions = {
	open: async ({ request, locals }) => {
		const { user } = requireRole(locals, ['supervisor', 'editor', 'admin']);
		const fd = await request.formData();
		const target = String(fd.get('target') ?? '');
		const kind = String(fd.get('kind') ?? '');
		if (!target || !['student_supervisor', 'admin_supervisor'].includes(kind)) {
			return fail(400, { error: 'Bad parameters' });
		}
		const convo = await getOrCreateConversation(locals.supabase, kind as any, user.id, target);
		throw redirect(303, `/editor/messages/${convo.id}`);
	}
};
