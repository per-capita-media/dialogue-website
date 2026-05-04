import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { listConversationsFor, getOrCreateConversation } from '$lib/server/queries/conversations';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = requireRole(locals, 'student');
	const conversations = await listConversationsFor(locals.supabase, user.id);

	// Help the student start a conversation with their assigned editor(s) or admin.
	const { data: editors } = await locals.supabase
		.from('student_supervisor_assignments')
		.select('supervisor_id, supervisor:profiles!student_supervisor_assignments_supervisor_id_fkey(full_name)')
		.eq('student_id', user.id);

	const { data: admins } = await locals.supabase
		.from('profiles')
		.select('id, full_name')
		.eq('role', 'admin');

	return {
		conversations,
		editors: (editors ?? []).map((r: any) => ({ id: r.supervisor_id, name: r.supervisor?.full_name })),
		admins: admins ?? []
	};
};

export const actions: Actions = {
	open: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'student');
		const fd = await request.formData();
		const target = String(fd.get('target') ?? '');
		const kind = String(fd.get('kind') ?? '');
		if (!target || !['student_supervisor', 'admin_student'].includes(kind)) {
			return fail(400, { error: 'Bad parameters' });
		}
		const convo = await getOrCreateConversation(locals.supabase, kind as any, user.id, target);
		throw redirect(303, `/student/messages/${convo.id}`);
	}
};
