/**
 * Auth/role/assignment guards. Every protected `+layout.server.ts` and
 * `+page.server.ts` must call one of these — they redirect or throw 403 on
 * failure. RLS at the database is the second line of defence.
 */
import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Profile, Role } from '$lib/types/domain';
import { dashboardForRole } from '$lib/roles';
export { dashboardForRole };

type Locals = RequestEvent['locals'];

/** Throws redirect to /auth/login when no session. Returns user + profile. */
export function requireUser(locals: Locals): { user: NonNullable<Locals['user']>; profile: Profile } {
	if (!locals.user) throw redirect(303, '/auth/login');
	if (!locals.profile) {
		// User is authenticated but has no profile row yet — should be impossible
		// in normal flow because signup inserts the row. Force a sign-out.
		throw redirect(303, '/auth/logout');
	}
	return { user: locals.user, profile: locals.profile };
}

/** Asserts the current user has one of the allowed roles. */
export function requireRole(locals: Locals, role: Role | Role[]) {
	const { user, profile } = requireUser(locals);
	const allowed = Array.isArray(role) ? role : [role];
	if (!allowed.includes(profile.role)) {
		throw error(403, 'Forbidden');
	}
	return { user, profile };
}

/** Redirects students who haven't finished onboarding to the wizard. */
export function requireOnboardingComplete(locals: Locals) {
	const ctx = requireUser(locals);
	if (!ctx.profile.onboarding_complete) {
		throw redirect(303, '/onboarding/profile');
	}
	return ctx;
}

/** Asserts the current supervisor is assigned to the given student. Admin bypass. */
export async function assertSupervisesStudent(locals: Locals, studentId: string) {
	const { profile } = requireUser(locals);
	if (profile.role === 'admin') return;
	if (profile.role !== 'supervisor' && profile.role !== 'editor') throw error(403, 'Forbidden');

	const { data } = await locals.supabase
		.from('student_supervisor_assignments')
		.select('id')
		.eq('student_id', studentId)
		.eq('supervisor_id', profile.id)
		.maybeSingle();
	if (!data) throw error(403, 'Not assigned to this student');
}

/** Asserts the current teacher is the named teacher contact for the student. */
export async function assertTeachesStudent(locals: Locals, studentId: string) {
	const { profile } = requireUser(locals);
	if (profile.role === 'admin') return;
	if (profile.role !== 'teacher') throw error(403, 'Forbidden');

	const { data } = await locals.supabase
		.from('profiles')
		.select('id')
		.eq('id', studentId)
		.eq('role', 'student')
		.ilike('teacher_email', profile.email)
		.maybeSingle();
	if (!data) throw error(403, 'Not linked to this student');
}

/** Helpful: send signed-in users away from /auth/* pages. */
export function redirectIfAuthed(locals: Locals) {
	if (!locals.profile) return;
	if (!locals.profile.onboarding_complete && locals.profile.role === 'student') {
		throw redirect(303, '/onboarding/profile');
	}
	throw redirect(303, dashboardForRole(locals.profile.role));
}
