/**
 * Helpers for the signup_invitations table. All functions here use the
 * service-role client so they can be called from public (unauthenticated)
 * signup routes — RLS would otherwise hide the rows.
 *
 * The route layer is responsible for validating that the role embedded in
 * the URL matches the role on the invitation row.
 */
import { supabaseAdmin } from './supabase-admin';
import type { Role } from '$lib/types/domain';
import { randomBytes } from 'node:crypto';

export interface Invitation {
	id: string;
	token: string;
	role: Exclude<Role, 'student'>;
	email: string | null;
	created_by: string | null;
	created_at: string;
	expires_at: string;
	consumed_at: string | null;
	consumed_by: string | null;
}

/** Generate a 32-byte cryptographically random URL-safe token. */
export function generateInvitationToken(): string {
	return randomBytes(32).toString('base64url');
}

/** Look up an invitation by token (no validation — caller must check). */
export async function findInvitation(token: string): Promise<Invitation | null> {
	if (!token) return null;
	const { data } = await supabaseAdmin
		.from('signup_invitations')
		.select('*')
		.eq('token', token)
		.maybeSingle<Invitation>();
	return data;
}

/** True iff the invitation is currently usable for the given role. */
export function isInvitationUsable(
	inv: Invitation | null,
	expectedRole: Exclude<Role, 'student'>
): inv is Invitation {
	if (!inv) return false;
	if (inv.role !== expectedRole) return false;
	if (inv.consumed_at) return false;
	if (new Date(inv.expires_at).getTime() <= Date.now()) return false;
	return true;
}

/**
 * Mark an invitation as consumed. The where-clause guard on `consumed_at is
 * null` makes this race-safe — if two requests arrive at the same time, only
 * one can flip the row from null → now().
 *
 * Returns true if this call was the one that consumed it.
 */
export async function consumeInvitation(
	invitationId: string,
	consumedBy: string
): Promise<boolean> {
	const { data, error } = await supabaseAdmin
		.from('signup_invitations')
		.update({ consumed_at: new Date().toISOString(), consumed_by: consumedBy })
		.eq('id', invitationId)
		.is('consumed_at', null)
		.select('id');
	if (error) throw error;
	return (data?.length ?? 0) > 0;
}
