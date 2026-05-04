/**
 * Thin Resend wrapper. If `RESEND_API_KEY` and `MAIL_FROM` are not set, the
 * module degrades to a no-op so local dev / preview deployments still work
 * (the URL is shown in the admin UI for manual sharing).
 *
 * Setup:
 *   1. Sign up at https://resend.com
 *   2. Verify your sending domain (or use the test address `onboarding@resend.dev`).
 *   3. Add to .env:
 *        RESEND_API_KEY=re_xxx
 *        MAIL_FROM="Dialogue <invitations@your-domain>"
 */
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

const apiKey = env.RESEND_API_KEY;
const from = env.MAIL_FROM;

const client = apiKey ? new Resend(apiKey) : null;

export interface SendResult {
	ok: boolean;
	skipped?: boolean; // true when no API key/from configured
	id?: string;
	error?: string;
}

export interface SendArgs {
	to: string;
	subject: string;
	html: string;
	text?: string;
	replyTo?: string;
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
	if (!client || !from) {
		return { ok: false, skipped: true };
	}
	try {
		const { data, error } = await client.emails.send({
			from,
			to: args.to,
			subject: args.subject,
			html: args.html,
			text: args.text,
			replyTo: args.replyTo
		});
		if (error) return { ok: false, error: error.message };
		return { ok: true, id: data?.id };
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : 'Unknown mailer error';
		return { ok: false, error: msg };
	}
}

/** True iff the mailer is configured. Used by UI to show clearer status. */
export function isMailerConfigured(): boolean {
	return !!(client && from);
}
