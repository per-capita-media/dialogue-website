import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/guards';
import { signedReadUrl } from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals }) => {
	requireRole(locals, 'student');
	const { data: material } = await locals.supabase
		.from('learning_materials')
		.select('*')
		.eq('type', 'webinar')
		.eq('active', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	let videoSrc = material?.video_url ?? null;
	if (material?.storage_path && !videoSrc) {
		try {
			videoSrc = await signedReadUrl(material.storage_path);
		} catch {
			videoSrc = null;
		}
	}
	return { material, videoSrc };
};
