/**
 * Stage helpers — keep label/description text in one place so dashboards stay
 * in sync with the enum in the database.
 */
import type { Profile, Role, StudentStage } from './types/domain';

export const STAGE_LABEL: Record<StudentStage, string> = {
	onboarding_incomplete: 'Onboarding incomplete',
	onboarding_complete: 'Onboarding complete',
	document_pending: 'Read the document',
	document_quiz_complete: 'Document quiz complete',
	webinar_pending: 'Watch the webinar',
	webinar_quiz_complete: 'Webinar quiz complete',
	pitches_in_progress: 'Pitches in progress',
	pitches_submitted: 'All 5 pitches submitted',
	awaiting_supervisor_selection: 'Awaiting editor selection',
	pitches_selected: '2 pitches selected',
	article_1_unlocked: 'Article 1 unlocked',
	article_1_submitted: 'Article 1 submitted',
	article_1_under_review: 'Article 1 under review',
	article_1_revision_requested: 'Article 1 revision requested',
	article_1_complete: 'Article 1 complete',
	article_2_locked: 'Article 2 locked',
	article_2_unlocked: 'Article 2 unlocked',
	article_2_submitted: 'Article 2 submitted',
	article_2_under_review: 'Article 2 under review',
	article_2_revision_requested: 'Article 2 revision requested',
	article_2_complete: 'Article 2 complete',
	programme_complete: 'Programme complete'
};

/** Tone (for badge color) at each stage. */
export const STAGE_TONE: Record<StudentStage, 'info' | 'warn' | 'success' | 'muted'> = {
	onboarding_incomplete: 'warn',
	onboarding_complete: 'info',
	document_pending: 'warn',
	document_quiz_complete: 'info',
	webinar_pending: 'warn',
	webinar_quiz_complete: 'info',
	pitches_in_progress: 'info',
	pitches_submitted: 'info',
	awaiting_supervisor_selection: 'warn',
	pitches_selected: 'info',
	article_1_unlocked: 'info',
	article_1_submitted: 'info',
	article_1_under_review: 'info',
	article_1_revision_requested: 'warn',
	article_1_complete: 'success',
	article_2_locked: 'muted',
	article_2_unlocked: 'info',
	article_2_submitted: 'info',
	article_2_under_review: 'info',
	article_2_revision_requested: 'warn',
	article_2_complete: 'success',
	programme_complete: 'success'
};

/**
 * What is the user's most actionable next step? Used by the landing-page
 * `NextStepPanel` and the in-dashboard sidebar hint, so they always agree.
 *
 * For students this is computed from `current_stage`; for staff it points at
 * their relevant dashboard.
 */
export interface NextStep {
	headline: string; // short imperative, e.g. "Read the document"
	detail: string; // one-sentence explanation
	href: string; // primary CTA target
	cta: string; // primary CTA label
}

const STUDENT_NEXT: Record<StudentStage, NextStep> = {
	onboarding_incomplete: {
		headline: 'Finish onboarding',
		detail: 'Tell us about you and pick your two themes — your pitches will live inside them.',
		href: '/onboarding/profile',
		cta: 'Continue onboarding'
	},
	onboarding_complete: {
		headline: 'Read the document',
		detail: 'Start with the primer, then take a short quiz to unlock the webinar.',
		href: '/student/learning/document',
		cta: 'Open the document'
	},
	document_pending: {
		headline: 'Read the document',
		detail: 'You need to read it and pass the quiz before you can move on.',
		href: '/student/learning/document',
		cta: 'Open the document'
	},
	document_quiz_complete: {
		headline: 'Watch the webinar',
		detail: 'Up next: the recorded webinar plus a short quiz.',
		href: '/student/learning/webinar',
		cta: 'Open the webinar'
	},
	webinar_pending: {
		headline: 'Watch the webinar',
		detail: 'Watch the recording and pass the quiz to unlock pitches.',
		href: '/student/learning/webinar',
		cta: 'Open the webinar'
	},
	webinar_quiz_complete: {
		headline: 'Start your 5 pitches',
		detail: 'Submit five pitches across your two themes. Your editor will pick two.',
		href: '/student/pitches',
		cta: 'Open pitches'
	},
	pitches_in_progress: {
		headline: 'Keep filling your pitches',
		detail: 'You need five submitted pitches before your editor can select two.',
		href: '/student/pitches',
		cta: 'Open pitches'
	},
	pitches_submitted: {
		headline: 'Awaiting editor selection',
		detail: 'Your five pitches are in. Your editor will choose two soon.',
		href: '/student/pitches',
		cta: 'View pitches'
	},
	awaiting_supervisor_selection: {
		headline: 'Awaiting editor selection',
		detail: 'Your editor is reviewing your pitches and will pick two.',
		href: '/student/pitches',
		cta: 'View pitches'
	},
	pitches_selected: {
		headline: 'Start Article 1',
		detail: 'Two pitches were selected. Open Article 1 to begin drafting.',
		href: '/student/articles/1',
		cta: 'Open Article 1'
	},
	article_1_unlocked: {
		headline: 'Draft Article 1',
		detail: 'Write and submit your first article for editor feedback.',
		href: '/student/articles/1',
		cta: 'Open Article 1'
	},
	article_1_submitted: {
		headline: 'Article 1 with your editor',
		detail: 'Submitted — your editor will leave feedback shortly.',
		href: '/student/articles/1',
		cta: 'View feedback'
	},
	article_1_under_review: {
		headline: 'Article 1 under review',
		detail: 'Your editor is reading. You will be notified of feedback.',
		href: '/student/articles/1',
		cta: 'View Article 1'
	},
	article_1_revision_requested: {
		headline: 'Revise Article 1',
		detail: 'Your editor has asked for changes. Re-open the draft to make edits.',
		href: '/student/articles/1',
		cta: 'Revise Article 1'
	},
	article_1_complete: {
		headline: 'Article 1 approved',
		detail: 'Article 2 will unlock once your editor opens it.',
		href: '/student/articles/2',
		cta: 'View Article 2'
	},
	article_2_locked: {
		headline: 'Article 2 locked',
		detail: 'Your editor (or an admin) will unlock it when ready.',
		href: '/student/articles/2',
		cta: 'View Article 2'
	},
	article_2_unlocked: {
		headline: 'Draft Article 2',
		detail: 'Article 2 is open — write and submit your second piece.',
		href: '/student/articles/2',
		cta: 'Open Article 2'
	},
	article_2_submitted: {
		headline: 'Article 2 with your editor',
		detail: 'Submitted — your editor will leave feedback shortly.',
		href: '/student/articles/2',
		cta: 'View Article 2'
	},
	article_2_under_review: {
		headline: 'Article 2 under review',
		detail: 'Your editor is reading.',
		href: '/student/articles/2',
		cta: 'View Article 2'
	},
	article_2_revision_requested: {
		headline: 'Revise Article 2',
		detail: 'Your editor has asked for changes.',
		href: '/student/articles/2',
		cta: 'Revise Article 2'
	},
	article_2_complete: {
		headline: 'Programme complete!',
		detail: 'Both articles are approved. Take a victory lap.',
		href: '/student',
		cta: 'View dashboard'
	},
	programme_complete: {
		headline: 'Programme complete!',
		detail: 'Both articles approved. Well done — you can keep messaging your editor.',
		href: '/student',
		cta: 'View dashboard'
	}
};

const ROLE_NEXT: Record<Exclude<Role, 'student'>, NextStep> = {
	teacher: {
		headline: 'Open your teacher dashboard',
		detail: 'Track linked students from your school and message the programme team.',
		href: '/teacher',
		cta: 'Open teacher dashboard'
	},
	supervisor: {
		headline: 'Open your editor dashboard',
		detail: 'See your assigned students, review their pitches, and leave article feedback.',
		href: '/editor',
		cta: 'Open editor dashboard'
	},
	editor: {
		headline: 'Open your editor dashboard',
		detail: 'See your assigned students, review their pitches, and leave article feedback.',
		href: '/editor',
		cta: 'Open editor dashboard'
	},
	admin: {
		headline: 'Open the admin console',
		detail: 'Manage students, teachers, editors, content, and invitations.',
		href: '/admin',
		cta: 'Open admin dashboard'
	}
};

/** Pure mapping from a profile to "what they should do next". */
export function nextStepFor(profile: Pick<Profile, 'role' | 'current_stage'>): NextStep {
	if (profile.role === 'student') return STUDENT_NEXT[profile.current_stage];
	return ROLE_NEXT[profile.role];
}
