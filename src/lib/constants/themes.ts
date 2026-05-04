/**
 * Fixed list of themes a student can choose from. MUST match the CHECK
 * constraint in `supabase/migrations/003_student_themes.sql`.
 */
export const ALL_THEMES = [
	'Economics',
	'History and Politics',
	'Law',
	'Film, Art and Design',
	'Medicine and Biological Sciences',
	'Technology and Artificial Intelligence',
	'Physical Sciences'
] as const;

export type Theme = (typeof ALL_THEMES)[number];
