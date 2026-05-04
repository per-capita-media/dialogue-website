import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { user } = requireRole(locals, ['teacher', 'admin']);
	const { data: convo } = await locals.supabase
		.from('conversations')
		.select('*')
		.eq('id', params.conversationId)
		.maybeSingle();
	if (!convo) throw error(404, 'Not found');
	const { data: messages } = await locals.supabase
		.from('messages')
		.select('*')
		.eq('conversation_id', params.conversationId)
		.order('created_at');
	return { convo, messages: messages ?? [], userId: user.id };
};

export const actions: Actions = {
	send: async ({ request, locals, params }) => {
		const { user } = requireRole(locals, ['teacher', 'admin']);
		const fd = await request.formData();
		const body = String(fd.get('body') ?? '').trim();
		if (!body) return fail(400, { error: 'Empty' });
		const { error: e } = await locals.supabase
			.from('messages')
			.insert({ conversation_id: params.conversationId, sender_id: user.id, body });
		if (e) return fail(400, { error: e.message });
		return { sent: true };
	}
};
