import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	const { data } = await locals.supabase
		.from('learning_materials')
		.select('*')
		.order('created_at', { ascending: false });
	return { materials: data ?? [] };
};

export const actions: Actions = {
	toggle: async ({ request, locals }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		const active = fd.get('active') === 'true';
		const { error } = await locals.supabase.from('learning_materials').update({ active }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { ok: true };
	}
};
