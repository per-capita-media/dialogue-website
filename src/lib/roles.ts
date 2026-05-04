/**
 * Tiny pure helpers safe to import from client and server alike.
 * (Anything in `$lib/server/*` is forbidden in client code by SvelteKit.)
 */
import type { Role } from './types/domain';

export function dashboardForRole(role: Role): string {
	switch (role) {
		case 'admin':
			return '/admin';
		case 'teacher':
			return '/teacher';
		case 'editor':
			return '/editor';
		case 'supervisor':
			return '/editor';
		case 'student':
			return '/student';
	}
}

export const ROLE_LABEL: Record<Role, string> = {
	student: 'Student',
	teacher: 'Teacher',
	supervisor: 'Editor',
	editor: 'Editor',
	admin: 'Admin'
};
