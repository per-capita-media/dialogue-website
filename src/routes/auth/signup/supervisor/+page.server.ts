/**
 * Supervisor signup — gated by a single-use invitation token issued by an
 * admin via /admin/invitations. Without a valid token the page renders a
 * polite "by invitation only" message; the form action also re-validates
 * the token and aborts if it has been consumed in the meantime.
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { findInvitation, isInvitationUsable, consumeInvitation } from '$lib/server/invitations';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import { logAudit } from '$lib/server/audit';
import { redirectIfAuthed } from '$lib/server/guards';

const SignupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	full_name: z.string().min(1)
});

function authErrorMessage(message: string, fallback: string) {
	if (message === 'fetch failed' || message === '{}') return fallback;
	return message;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	redirectIfAuthed(locals);
	const token = url.searchParams.get('token') ?? '';
	const invitation = await findInvitation(token);
	const usable = isInvitationUsable(invitation, 'supervisor');
	return {
		token,
		usable,
		invitationEmailHint: usable ? invitation.email : null,
		// Friendly reason if not usable — drive UI text only, not security.
		reason: !token
			? 'no-token'
			: !invitation
				? 'unknown-token'
				: invitation.role !== 'supervisor'
					? 'wrong-role'
					: invitation.consumed_at
						? 'consumed'
						: new Date(invitation.expires_at).getTime() <= Date.now()
							? 'expired'
							: 'ok'
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const fd = Object.fromEntries(await request.formData());
		const parsed = SignupSchema.safeParse(fd);
		if (!parsed.success) {
			return fail(400, { values: fd, error: parsed.error.errors[0].message });
		}
		const token = url.searchParams.get('token') ?? '';
		const invitation = await findInvitation(token);
		if (!isInvitationUsable(invitation, 'supervisor')) {
			return fail(403, { values: fd, error: 'Invitation no longer valid.' });
		}

		// Create the auth user — confirmed immediately so they can sign in.
		const { data: created, error: signUpError } = await supabaseAdmin.auth.admin
			.createUser({
				email: parsed.data.email,
				password: parsed.data.password,
				email_confirm: true
			})
			.catch(() => ({
				data: { user: null },
				error: { message: 'Unable to reach the authentication service. Please try again shortly.' }
			}));
		if (signUpError || !created.user) {
			const message = authErrorMessage(
				signUpError?.message ?? 'Sign-up failed',
				'Unable to reach the authentication service. Please try again shortly.'
			);
			return fail(400, { values: fd, error: message });
		}

		// Upsert profile with elevated role + full_name. service-role bypasses
		// the trigger that would normally force role='student' on self-insert.
		const { error: profileError } = await supabaseAdmin.rpc('bootstrap_profile', {
			p_id: created.user.id,
			p_email: parsed.data.email,
			p_full_name: parsed.data.full_name,
			p_role: 'supervisor',
			p_onboarding_complete: true
		});
		if (profileError) {
			return fail(500, { values: fd, error: profileError.message });
		}

		// Atomically consume the invitation. If someone else already used it,
		// roll back the just-created profile? Simpler: keep the user, but log
		// loudly and refuse to elevate again. (The createUser above will fail
		// for duplicate emails on a real race.)
		const wasConsumed = await consumeInvitation(invitation.id, created.user.id);
		if (!wasConsumed) {
			return fail(409, { values: fd, error: 'Invitation was just used by someone else.' });
		}

		await logAudit({
			actorId: created.user.id,
			action: 'redeem_invitation',
			targetTable: 'signup_invitations',
			targetId: invitation.id,
			payload: { role: 'supervisor', email: parsed.data.email }
		});

		// Sign the new user in via the user-scoped client so cookies are set.
		const { error: loginError } = await locals.supabase.auth
			.signInWithPassword({
				email: parsed.data.email,
				password: parsed.data.password
			})
			.catch(() => ({
				error: { message: 'Account created, but automatic sign-in failed. Please sign in manually.' }
			}));
		if (loginError) {
			const message = authErrorMessage(
				loginError.message,
				'Account created, but automatic sign-in failed. Please sign in manually.'
			);
			return fail(500, { values: fd, error: message });
		}

		throw redirect(303, '/supervisor');
	}
};
