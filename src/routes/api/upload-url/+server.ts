/**
 * POST /api/upload-url — admin-only signed upload URL for the
 * `learning-materials` bucket. Body: { path: string }.
 */
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/guards';
import { json, error } from '@sveltejs/kit';
import { signedUploadUrl } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request, locals }) => {
	requireRole(locals, 'admin');
	const { path } = (await request.json()) as { path?: string };
	if (!path) throw error(400, 'Missing path');
	const data = await signedUploadUrl(path);
	return json(data);
};
