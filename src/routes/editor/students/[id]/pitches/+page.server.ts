import type { PageServerLoad, Actions } from './$types';
import { requireRole, assertSupervisesStudent } from '$lib/server/guards';
import { fail, redirect } from '@sveltejs/kit';
import { logAudit } from '$lib/server/audit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireRole(locals, ['supervisor', 'editor', 'admin']);
	await assertSupervisesStudent(locals, params.id);

	const { data: pitches } = await locals.supabase
		.from('pitches')
		.select('*')
		.eq('student_id', params.id)
		.order('slot_index');
	return { studentId: params.id, pitches: pitches ?? [] };
};

export const actions: Actions = {
	select: async ({ request, locals, params }) => {
		const { user } = requireRole(locals, ['supervisor', 'editor', 'admin']);
		await assertSupervisesStudent(locals, params.id);

		const fd = await request.formData();
		const ids = fd.getAll('selected').map(String);
		if (ids.length !== 2) {
			return fail(400, { error: 'You must pick exactly 2 pitches.' });
		}

		const { data: allPitches } = await locals.supabase
			.from('pitches')
			.select('id, slot_index, status')
			.eq('student_id', params.id);
		if (!allPitches) return fail(500, { error: 'Could not load pitches' });

		const chosenSorted = allPitches
			.filter((p) => ids.includes(p.id))
			.sort((a, b) => a.slot_index - b.slot_index);
		if (chosenSorted.length !== 2) return fail(400, { error: 'One or more chosen pitches not found' });

		await supabaseAdmin
			.from('pitches')
			.update({ status: 'selected', article_number: 1, selected_by: user.id, selected_at: new Date().toISOString() })
			.eq('id', chosenSorted[0].id);
		await supabaseAdmin
			.from('pitches')
			.update({ status: 'selected', article_number: 2, selected_by: user.id, selected_at: new Date().toISOString() })
			.eq('id', chosenSorted[1].id);

		await supabaseAdmin
			.from('pitches')
			.update({ status: 'rejected' })
			.eq('student_id', params.id)
			.eq('status', 'submitted')
			.not('id', 'in', `(${ids.map((i) => `"${i}"`).join(',')})`);

		await supabaseAdmin.from('articles').upsert(
			[
				{
					student_id: params.id,
					pitch_id: chosenSorted[0].id,
					article_number: 1,
					title: ''
				},
				{
					student_id: params.id,
					pitch_id: chosenSorted[1].id,
					article_number: 2,
					title: ''
				}
			],
			{ onConflict: 'student_id,article_number' }
		);

		await logAudit({
			actorId: user.id,
			action: 'select_pitches',
			targetTable: 'pitches',
			payload: { studentId: params.id, pitchIds: ids }
		});

		throw redirect(303, `/editor/students/${params.id}`);
	}
};
