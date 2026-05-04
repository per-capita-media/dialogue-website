import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, profile } = requireRole(locals, 'student');

	// Hard gate: must have passed both quizzes.
	const { data: attempts } = await locals.supabase
		.from('quiz_attempts')
		.select('passed, quizzes(type)')
		.eq('student_id', user.id);
	const docPassed = (attempts ?? []).some((a: any) => a.passed && a.quizzes?.type === 'document');
	const webPassed = (attempts ?? []).some((a: any) => a.passed && a.quizzes?.type === 'webinar');
	if (!docPassed || !webPassed) throw error(403, 'Finish the document & webinar quizzes first.');

	const [{ data: themes }, { data: pitches }] = await Promise.all([
		locals.supabase.from('student_themes').select('theme').eq('student_id', user.id),
		locals.supabase.from('pitches').select('*').eq('student_id', user.id).order('slot_index')
	]);

	// Build 5 slots: existing pitch or null placeholder.
	const slots = Array.from({ length: 5 }, (_, i) => {
		const slot = i + 1;
		return {
			slot_index: slot,
			pitch: (pitches ?? []).find((p) => p.slot_index === slot) ?? null
		};
	});

	return { profile, themes: (themes ?? []).map((t) => t.theme), slots };
};
