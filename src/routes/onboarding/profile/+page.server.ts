import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guards';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = requireUser(locals);
	return { profile };
};

const Schema = z.object({
	full_name: z.string().min(1),
	school_name: z.string().min(1),
	year_group: z.string().min(1),
	email: z.string().email(),
	teacher_name: z.string().min(1),
	teacher_email: z.string().email()
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = requireUser(locals);
		const form = Object.fromEntries(await request.formData());
		const parsed = Schema.safeParse(form);
		if (!parsed.success) {
			return fail(400, { values: form, error: parsed.error.errors[0].message });
		}

		const { error } = await locals.supabase
			.from('profiles')
			.update({ ...parsed.data })
			.eq('id', user.id);
		if (error) return fail(500, { values: form, error: error.message });
		throw redirect(303, '/onboarding/themes');
	}
};
