import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { signedReadUrl } from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'student');
	const { data: material } = await locals.supabase
		.from('learning_materials')
		.select('*')
		.eq('type', 'document')
		.eq('active', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	let signedUrl: string | null = null;
	if (material?.storage_path) {
		try {
			signedUrl = await signedReadUrl(material.storage_path);
		} catch (e) {
			signedUrl = null;
		}
	}
	return { material, signedUrl };
};
