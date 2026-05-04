import type { Actions, PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase-admin';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireRole(locals, 'admin');
		const fd = await request.formData();
		const type = String(fd.get('type') ?? 'document');
		const title = String(fd.get('title') ?? '').trim();
		const description = String(fd.get('description') ?? '');
		const video_url = String(fd.get('video_url') ?? '') || null;
		const file = fd.get('file') as File | null;

		if (!title) return fail(400, { error: 'Title required' });

		let storage_path: string | null = null;
		if (file && file.size > 0) {
			const ext = file.name.split('.').pop() ?? 'bin';
			storage_path = `${type}/${crypto.randomUUID()}.${ext}`;
			const { error: upErr } = await supabaseAdmin.storage
				.from('learning-materials')
				.upload(storage_path, file, { contentType: file.type, upsert: false });
			if (upErr) return fail(400, { error: upErr.message });
		}

		const { error } = await supabaseAdmin.from('learning_materials').insert({
			type,
			title,
			description,
			video_url,
			storage_path,
			active: true
		});
		if (error) return fail(400, { error: error.message });
		throw redirect(303, '/admin/learning-materials');
	}
};
