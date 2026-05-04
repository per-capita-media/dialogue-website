import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { listConversationsFor, getOrCreateConversation } from '$lib/server/queries/conversations';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = requireRole(locals, ['teacher', 'admin']);
	const conversations = await listConversationsFor(locals.supabase, user.id);
	const { data: admins } = await locals.supabase.from('profiles').select('id, full_name').eq('role', 'admin');

	return { conversations, admins: admins ?? [] };
};

export const actions: Actions = {
	open: async ({ request, locals }) => {
		const { user } = requireRole(locals, ['teacher', 'admin']);
		const fd = await request.formData();
		const target = String(fd.get('target') ?? '');
		if (!target) return fail(400, { error: 'Choose an admin to message' });
		const convo = await getOrCreateConversation(locals.supabase, 'admin_supervisor' as any, user.id, target);
		throw redirect(303, `/teacher/messages/${convo.id}`);
	}
};
