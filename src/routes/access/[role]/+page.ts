import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const accessPages = {
	student: {
		label: 'Student access',
		eyebrow: 'Open application',
		title: 'Students apply directly.',
		body:
			'Student accounts are for eligible Dialogue participants. Students can manage their own profile, learning tasks, pitches, article drafts, feedback, and programme messages.',
		primaryHref: '/auth/signup',
		primaryLabel: 'Apply as a student',
		secondaryHref: '/auth/login',
		secondaryLabel: 'Student sign in',
		notes: ['Private workspace', 'Own submissions only', 'Editor feedback visible when assigned']
	},
	teacher: {
		label: 'Teacher access',
		eyebrow: 'Invitation only',
		title: 'Teachers join by admin invitation.',
		body:
			'Teacher accounts support school verification and cohort oversight. They are scoped to their school or contact cohort and do not expose unrelated students or private editorial work.',
		primaryHref: '/auth/signup/teacher',
		primaryLabel: 'Use teacher invite',
		secondaryHref: '/auth/login',
		secondaryLabel: 'Teacher sign in',
		notes: ['School-scoped view', 'Progress summaries', 'Admin messaging']
	},
	editor: {
		label: 'Editor access',
		eyebrow: 'Invitation only',
		title: 'Editors are assigned by administrators.',
		body:
			'Editor accounts are for the Per Capita team members who review student pitches and article drafts. Access is limited to assigned students and relevant conversations.',
		primaryHref: '/auth/signup/editor',
		primaryLabel: 'Use editor invite',
		secondaryHref: '/auth/login',
		secondaryLabel: 'Editor sign in',
		notes: ['Assigned students only', 'Pitch and article review', 'Private feedback threads']
	},
	admin: {
		label: 'Admin access',
		eyebrow: 'Restricted',
		title: 'Admins manage programme operations.',
		body:
			'Admin accounts are restricted to authorised programme operators. New admins must use an invitation from an existing admin after the first account has been created by the setup script.',
		primaryHref: '/auth/signup/admin',
		primaryLabel: 'Use admin invite',
		secondaryHref: '/auth/login',
		secondaryLabel: 'Admin sign in',
		notes: ['Staff invitations', 'Programme setup', 'Audit and support tools']
	}
} as const;

export const load: PageLoad = ({ params }) => {
	const page = accessPages[params.role as keyof typeof accessPages];

	if (!page) {
		throw error(404, 'Access page not found');
	}

	return page;
};
