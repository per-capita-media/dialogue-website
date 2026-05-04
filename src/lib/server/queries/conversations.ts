import type { SupabaseClient } from '@supabase/supabase-js';
import type { Conversation, ConversationKind } from '$lib/types/domain';
import { supabaseAdmin } from '../supabase-admin';

/** Sorted pair so the unique constraint on (least, greatest) holds. */
function sortedPair(a: string, b: string): [string, string] {
	return a < b ? [a, b] : [b, a];
}

/** Look up an existing conversation between two users for a given kind. */
export async function findConversation(
	supabase: SupabaseClient,
	kind: ConversationKind,
	userA: string,
	userB: string
) {
	const [a, b] = sortedPair(userA, userB);
	const { data } = await supabase
		.from('conversations')
		.select('*')
		.eq('kind', kind)
		.eq('participant_a', a)
		.eq('participant_b', b)
		.maybeSingle<Conversation>();
	return data;
}

/** Get-or-create. Uses service-role for the insert since a non-admin user
 *  inserting an admin↔X conversation would fail RLS otherwise. */
export async function getOrCreateConversation(
	supabase: SupabaseClient,
	kind: ConversationKind,
	userA: string,
	userB: string
) {
	const existing = await findConversation(supabase, kind, userA, userB);
	if (existing) return existing;
	const [a, b] = sortedPair(userA, userB);
	const { data, error } = await supabaseAdmin
		.from('conversations')
		.insert({ kind, participant_a: a, participant_b: b })
		.select('*')
		.single<Conversation>();
	if (error) throw error;
	return data;
}

export interface ConversationListRow {
	id: string;
	kind: ConversationKind;
	other_id: string;
	other_name: string | null;
	other_role: string;
	last_at: string | null;
	last_body: string | null;
}

/** List all conversations the current user participates in, with the other
 *  participant's name and the most recent message preview. */
export async function listConversationsFor(supabase: SupabaseClient, userId: string) {
	const { data: convos } = await supabase
		.from('conversations')
		.select(
			`id, kind, participant_a, participant_b,
			a:profiles!conversations_participant_a_fkey(id, full_name, role),
			b:profiles!conversations_participant_b_fkey(id, full_name, role)`
		)
		.or(`participant_a.eq.${userId},participant_b.eq.${userId}`);

	const list: ConversationListRow[] = (convos ?? []).map((c: any) => {
		const other = c.participant_a === userId ? c.b : c.a;
		return {
			id: c.id,
			kind: c.kind,
			other_id: other?.id,
			other_name: other?.full_name,
			other_role: other?.role,
			last_at: null,
			last_body: null
		};
	});

	if (list.length === 0) return list;
	const ids = list.map((c) => c.id);
	const { data: lastMsgs } = await supabase
		.from('messages')
		.select('conversation_id, body, created_at')
		.in('conversation_id', ids)
		.order('created_at', { ascending: false });
	const seen = new Set<string>();
	for (const m of lastMsgs ?? []) {
		if (seen.has(m.conversation_id)) continue;
		seen.add(m.conversation_id);
		const row = list.find((c) => c.id === m.conversation_id);
		if (row) {
			row.last_at = m.created_at as string;
			row.last_body = m.body as string;
		}
	}
	list.sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''));
	return list;
}
