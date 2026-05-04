import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const SlotSchema = z.coerce.number().int().min(1).max(5);

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = requireRole(locals, 'student');
	const slot = SlotSchema.safeParse(params.slot);
	if (!slot.success) throw error(404, 'Bad slot');

	const [{ data: themes }, { data: pitch }] = await Promise.all([
		locals.supabase.from('student_themes').select('theme').eq('student_id', user.id),
		locals.supabase
			.from('pitches')
			.select('*')
			.eq('student_id', user.id)
			.eq('slot_index', slot.data)
			.maybeSingle()
	]);

	return {
		slot: slot.data,
		themes: (themes ?? []).map((t) => t.theme as string),
		pitch
	};
};

const FieldSchema = z.object({
	theme: z.string().min(1),
	title: z.string().min(1),
	source_material: z.string().min(1),
	research: z.string().min(1),
	proposal: z.string().min(1)
});

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const { user } = requireRole(locals, 'student');
		const slot = SlotSchema.parse(params.slot);
		const fd = Object.fromEntries(await request.formData());
		const parsed = FieldSchema.safeParse(fd);
		if (!parsed.success) return fail(400, { values: fd, error: parsed.error.errors[0].message });

		const payload = {
			student_id: user.id,
			slot_index: slot,
			...parsed.data,
			status: 'draft' as const
		};

		const { error: e } = await locals.supabase
			.from('pitches')
			.upsert(payload, { onConflict: 'student_id,slot_index' });
		if (e) return fail(400, { values: fd, error: e.message });
		return { saved: true };
	},

	submit: async ({ request, params, locals }) => {
		const { user } = requireRole(locals, 'student');
		const slot = SlotSchema.parse(params.slot);
		const fd = Object.fromEntries(await request.formData());
		const parsed = FieldSchema.safeParse(fd);
		if (!parsed.success) return fail(400, { values: fd, error: parsed.error.errors[0].message });

		// Upsert as draft first (theme/title/etc), then flip status.
		const upsert = await locals.supabase
			.from('pitches')
			.upsert(
				{
					student_id: user.id,
					slot_index: slot,
					...parsed.data,
					status: 'draft'
				},
				{ onConflict: 'student_id,slot_index' }
			);
		if (upsert.error) return fail(400, { values: fd, error: upsert.error.message });

		const flip = await locals.supabase
			.from('pitches')
			.update({ status: 'submitted' })
			.eq('student_id', user.id)
			.eq('slot_index', slot);
		if (flip.error) return fail(400, { values: fd, error: flip.error.message });

		throw redirect(303, '/student/pitches');
	}
};
