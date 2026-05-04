import type { Actions, PageServerLoad } from './$types';
import { findInvitation, isInvitationUsable } from '$lib/server/invitations';
import { redirectIfAuthed } from '$lib/server/guards';
import { invitationReason, staffSignupAction } from '$lib/server/staff-signup';

export const load: PageServerLoad = async ({ url, locals }) => {
	redirectIfAuthed(locals);
	const token = url.searchParams.get('token') ?? '';
	const invitation = await findInvitation(token);
	const usable = isInvitationUsable(invitation, 'teacher');
	return {
		token,
		usable,
		invitationEmailHint: usable ? invitation.email : null,
		reason: invitationReason(token, invitation, 'teacher')
	};
};

export const actions: Actions = {
	default: (event) => staffSignupAction(event, 'teacher', '/teacher')
};
