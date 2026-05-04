/**
 * Invitation email template. Plain HTML — no MJML/templating dependency for
 * the MVP. Inline styles so it renders the same way in every email client.
 */
import type { Role } from '$lib/types/domain';

export interface InvitationEmailArgs {
	to: string;
	role: Exclude<Role, 'student'>;
	url: string;
	inviterName?: string;
	expiresAt: string;
	siteName?: string;
}

export function renderInvitationEmail(args: InvitationEmailArgs): { subject: string; html: string; text: string } {
	const site = args.siteName ?? 'Dialogue Intro to Journalism';
	const roleLabel =
		args.role === 'admin'
			? 'Admin'
			: args.role === 'teacher'
				? 'Teacher'
				: 'Editor';
	const expires = new Date(args.expiresAt).toLocaleString();
	const inviter = args.inviterName ? args.inviterName : 'A site admin';

	const subject = `${inviter} invited you to ${site} as ${roleLabel}`;

	// Keep HTML simple + inline-styled so it renders consistently in Gmail,
	// Outlook, Apple Mail, etc. No external CSS, no <style> blocks.
	const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:32px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6B7280;">${escapeHtml(site)}</p>
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1A1A1A;">You've been invited as a ${escapeHtml(roleLabel)}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1A1A1A;">
          ${escapeHtml(inviter)} has invited you to join <strong>${escapeHtml(site)}</strong> as a <strong>${escapeHtml(roleLabel)}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#1A1A1A;">
          Click the button below to set up your account. The link is single-use and expires on <strong>${escapeHtml(expires)}</strong>.
        </p>
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${escapeAttr(args.url)}" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:15px;">
            Accept invitation
          </a>
        </p>
        <p style="margin:0 0 8px;font-size:12px;color:#6B7280;">If the button doesn't work, paste this URL into your browser:</p>
        <p style="margin:0 0 24px;font-size:12px;color:#6B7280;word-break:break-all;">
          <a href="${escapeAttr(args.url)}" style="color:#1C4CBD;">${escapeHtml(args.url)}</a>
        </p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
        <p style="margin:0;font-size:12px;color:#6B7280;">
          You're receiving this because someone entered <strong>${escapeHtml(args.to)}</strong> as a ${escapeHtml(roleLabel)} invitation. If this is unexpected, you can safely ignore this email.
        </p>
      </div>
    </div>
  </body>
</html>`;

	const text = `${inviter} has invited you to ${site} as a ${roleLabel}.

Accept the invitation (single-use, expires ${expires}):
${args.url}

If this is unexpected, you can ignore this email.`;

	return { subject, html, text };
}

// ── Tiny HTML escape helpers (no extra deps) ─────────────────────────
function escapeHtml(s: string): string {
	return s.replace(/[&<>"']/g, (c) =>
		({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);
}
function escapeAttr(s: string): string {
	return escapeHtml(s);
}
