/**
 * Tiny pure helpers safe to import from client and server alike.
 * (Anything in `$lib/server/*` is forbidden in client code by SvelteKit.)
 */
import type { Role } from './types/domain';

export function dashboardForRole(role: Role): string {
	switch (role) {
		case 'admin':
			return '/admin';
		case 'supervisor':
			return '/supervisor';
		case 'student':
			return '/student';
	}
}

export const ROLE_LABEL: Record<Role, string> = {
	student: 'Student',
	supervisor: 'Supervisor',
	admin: 'Admin'
};
