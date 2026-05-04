/**
 * Append a row to public.audit_log via the service-role client (bypasses RLS).
 * Used by admin/supervisor mutations: assignment changes, theme overrides,
 * pitch selection, article unlocking, etc.
 */
import { supabaseAdmin } from './supabase-admin';

export async function logAudit(opts: {
	actorId: string;
	action: string;
	targetTable?: string;
	targetId?: string;
	payload?: Record<string, unknown>;
}) {
	await supabaseAdmin.from('audit_log').insert({
		actor_id: opts.actorId,
		action: opts.action,
		target_table: opts.targetTable ?? null,
		target_id: opts.targetId ?? null,
		payload: opts.payload ?? null
	});
}
