import type { Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const type = String(fd.get('type') ?? 'document');
		const title = String(fd.get('title') ?? '').trim();
		const pass_threshold = Number(fd.get('pass_threshold') ?? 70);
		if (!title) return fail(400, { error: 'Title required' });
		const { data, error } = await locals.supabase
			.from('quizzes')
			.insert({ type, title, pass_threshold, active: true })
			.select('id')
			.single();
		if (error) return fail(400, { error: error.message });
		throw redirect(303, `/admin/quizzes/${data.id}/edit`);
	}
};
