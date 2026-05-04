/**
 * Admin signup — gated by a single-use invitation token issued by an existing
 * admin via /admin/invitations. The very first admin is bootstrapped via
 * `npm run create-admin -- ...`. After that, every admin comes through here.
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
	const usable = isInvitationUsable(invitation, 'admin');
	return {
		token,
		usable,
		invitationEmailHint: usable ? invitation.email : null,
		reason: !token
			? 'no-token'
			: !invitation
				? 'unknown-token'
				: invitation.role !== 'admin'
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
		if (!isInvitationUsable(invitation, 'admin')) {
			return fail(403, { values: fd, error: 'Invitation no longer valid.' });
		}

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

		const { error: profileError } = await supabaseAdmin.rpc('bootstrap_profile', {
			p_id: created.user.id,
			p_email: parsed.data.email,
			p_full_name: parsed.data.full_name,
			p_role: 'admin',
			p_onboarding_complete: true
		});
		if (profileError) return fail(500, { values: fd, error: profileError.message });

		const wasConsumed = await consumeInvitation(invitation.id, created.user.id);
		if (!wasConsumed) {
			return fail(409, { values: fd, error: 'Invitation was just used by someone else.' });
		}

		await logAudit({
			actorId: created.user.id,
			action: 'redeem_invitation',
			targetTable: 'signup_invitations',
			targetId: invitation.id,
			payload: { role: 'admin', email: parsed.data.email }
		});

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

		throw redirect(303, '/admin');
	}
};
