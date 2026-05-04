/**
 * GET /api/signed-asset/<bucket-path> — returns a short-lived signed read URL
 * for an authenticated user. The bucket-path parameter is rest-matched with [...path].
 */
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guards';
import { json } from '@sveltejs/kit';
import { signedReadUrl } from '$lib/server/storage';

export const GET: RequestHandler = async ({ locals, params }) => {
	requireUser(locals);
	const url = await signedReadUrl(params.path);
	return json({ url });
};
