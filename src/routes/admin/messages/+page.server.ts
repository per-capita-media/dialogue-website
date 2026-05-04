import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data: convos } = await locals.supabase
		.from('conversations')
		.select(
			`id, kind, participant_a, participant_b, created_at,
			a:profiles!conversations_participant_a_fkey(full_name, role),
			b:profiles!conversations_participant_b_fkey(full_name, role)`
		)
		.order('created_at', { ascending: false });
	return {
		convos: (convos ?? []).map((convo) => ({
			...convo,
			a: Array.isArray(convo.a) ? (convo.a[0] ?? null) : convo.a,
			b: Array.isArray(convo.b) ? (convo.b[0] ?? null) : convo.b
		}))
	};
};
