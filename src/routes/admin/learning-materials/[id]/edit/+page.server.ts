import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { error, fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireRole(locals, 'admin');
	const { data } = await locals.supabase
		.from('learning_materials')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();
	if (!data) throw error(404, 'Not found');
	return { material: data };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const update: Record<string, unknown> = {
			title: String(fd.get('title') ?? ''),
			description: String(fd.get('description') ?? ''),
			video_url: String(fd.get('video_url') ?? '') || null
		};
		const file = fd.get('file') as File | null;
		if (file && file.size > 0) {
			const type = String(fd.get('type') ?? 'document');
			const ext = file.name.split('.').pop() ?? 'bin';
			const path = `${type}/${crypto.randomUUID()}.${ext}`;
			const { error: upErr } = await supabaseAdmin.storage
				.from('learning-materials')
				.upload(path, file, { contentType: file.type, upsert: false });
			if (upErr) return fail(400, { error: upErr.message });
			update.storage_path = path;
		}
		const { error: e } = await supabaseAdmin
			.from('learning_materials')
			.update(update)
			.eq('id', params.id);
		if (e) return fail(400, { error: e.message });
		throw redirect(303, '/admin/learning-materials');
	}
};
