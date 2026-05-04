import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { consumeInvitation, findInvitation, isInvitationUsable } from '$lib/server/invitations';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import { logAudit } from '$lib/server/audit';
import type { Role } from '$lib/types/domain';

export const StaffSignupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	full_name: z.string().min(1)
});

export function invitationReason(
	token: string,
	invitation: { role: Role; consumed_at: string | null; expires_at: string } | null,
	expectedRole: Exclude<Role, 'student'>
) {
	return !token
		? 'no-token'
		: !invitation
			? 'unknown-token'
			: invitation.role !== expectedRole
				? 'wrong-role'
				: invitation.consumed_at
					? 'consumed'
					: new Date(invitation.expires_at).getTime() <= Date.now()
						? 'expired'
						: 'ok';
}

function authErrorMessage(message: string, fallback: string) {
	if (message === 'fetch failed' || message === '{}') return fallback;
	return message;
}

export async function staffSignupAction(
	event: RequestEvent,
	role: Exclude<Role, 'student'>,
	redirectTo: string
) {
	const fd = Object.fromEntries(await event.request.formData());
	const parsed = StaffSignupSchema.safeParse(fd);
	if (!parsed.success) {
		return fail(400, { values: fd, error: parsed.error.errors[0].message });
	}

	const token = event.url.searchParams.get('token') ?? '';
	const invitation = await findInvitation(token);
	if (!isInvitationUsable(invitation, role)) {
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
		p_role: role,
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
		payload: { role, email: parsed.data.email }
	});

	const { error: loginError } = await event.locals.supabase.auth
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

	throw redirect(303, redirectTo);
}
