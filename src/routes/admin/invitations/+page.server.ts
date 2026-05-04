/**
 * Admin: list, issue, and revoke supervisor/admin invitations. The signup
 * URL is rendered server-side so admins can copy & share it. Optionally —
 * when `RESEND_API_KEY` + `MAIL_FROM` are set — the invitation is emailed
 * to the recipient automatically. The URL stays visible in the UI either
 * way for manual sharing.
 */
import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail } from '@sveltejs/kit';
import { generateInvitationToken } from '$lib/server/invitations';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import { logAudit } from '$lib/server/audit';
import { sendEmail, isMailerConfigured } from '$lib/server/mailer';
import { renderInvitationEmail } from '$lib/server/emails/invitation';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals, url }) => {
	requireRole(locals, 'admin');
	// service-role read so we don't have to round-trip through RLS just to
	// surface them to the admin UI (the page is already admin-gated).
	const { data } = await supabaseAdmin
		.from('signup_invitations')
		.select('*, creator:profiles!signup_invitations_created_by_fkey(full_name)')
		.order('created_at', { ascending: false });
	return {
		invitations: data ?? [],
		origin: url.origin,
		mailerReady: isMailerConfigured()
	};
};

const CreateSchema = z.object({
	role: z.enum(['supervisor', 'admin']),
	email: z.string().email(),
	expires_in_days: z.coerce.number().int().min(1).max(30).default(7),
	send_email: z
		.union([z.literal('on'), z.literal('off'), z.literal('')])
		.optional()
		.transform((v) => v === 'on')
});

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		const { user, profile } = requireRole(locals, 'admin');
		const fd = Object.fromEntries(await request.formData());
		const parsed = CreateSchema.safeParse(fd);
		if (!parsed.success) return fail(400, { error: parsed.error.errors[0].message });

		const token = generateInvitationToken();
		const expires_at = new Date(
			Date.now() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000
		).toISOString();
		const inviteUrl = `${url.origin}/auth/signup/${parsed.data.role}?token=${token}`;

		const insertResult = await supabaseAdmin.from('signup_invitations').insert({
			token,
			role: parsed.data.role,
			email: parsed.data.email,
			created_by: user.id,
			expires_at
		});
		if (insertResult.error) return fail(400, { error: insertResult.error.message });

		await logAudit({
			actorId: user.id,
			action: 'create_invitation',
			targetTable: 'signup_invitations',
			payload: { role: parsed.data.role, email: parsed.data.email }
		});

		// Optionally email the invitation. We do this AFTER the row is created
		// so an email failure doesn't lose the invitation — the admin can copy
		// the URL manually from the table even if the send fails.
		let emailStatus: { ok: boolean; skipped?: boolean; error?: string } | null = null;
		if (parsed.data.send_email) {
			const { subject, html, text } = renderInvitationEmail({
				to: parsed.data.email,
				role: parsed.data.role,
				url: inviteUrl,
				inviterName: profile.full_name ?? undefined,
				expiresAt: expires_at
			});
			const send = await sendEmail({ to: parsed.data.email, subject, html, text });
			emailStatus = send;
			if (send.ok) {
				await logAudit({
					actorId: user.id,
					action: 'invitation_email_sent',
					payload: { to: parsed.data.email, providerMessageId: send.id }
				});
			} else if (!send.skipped) {
				await logAudit({
					actorId: user.id,
					action: 'invitation_email_failed',
					payload: { to: parsed.data.email, error: send.error }
				});
			}
		}

		return { ok: true, emailStatus };
	},

	resendEmail: async ({ request, locals, url }) => {
		const { user, profile } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing id' });

		const { data: inv } = await supabaseAdmin
			.from('signup_invitations')
			.select('*')
			.eq('id', id)
			.maybeSingle();
		if (!inv) return fail(404, { error: 'Invitation not found' });
		if (!inv.email) return fail(400, { error: 'No email on file for this invitation' });
		if (inv.consumed_at) return fail(400, { error: 'Invitation already consumed' });

		const inviteUrl = `${url.origin}/auth/signup/${inv.role}?token=${inv.token}`;
		const { subject, html, text } = renderInvitationEmail({
			to: inv.email,
			role: inv.role,
			url: inviteUrl,
			inviterName: profile.full_name ?? undefined,
			expiresAt: inv.expires_at
		});
		const send = await sendEmail({ to: inv.email, subject, html, text });
		await logAudit({
			actorId: user.id,
			action: send.ok ? 'invitation_email_resent' : 'invitation_email_failed',
			targetTable: 'signup_invitations',
			targetId: id,
			payload: { to: inv.email, error: send.error }
		});
		return { ok: send.ok, error: send.error, skipped: send.skipped };
	},

	revoke: async ({ request, locals }) => {
		const { user } = requireRole(locals, 'admin');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { error: 'Missing id' });
		const { error } = await supabaseAdmin.from('signup_invitations').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		await logAudit({
			actorId: user.id,
			action: 'revoke_invitation',
			targetTable: 'signup_invitations',
			targetId: id
		});
		return { ok: true };
	}
};
