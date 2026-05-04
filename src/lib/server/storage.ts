/**
 * Helpers for the `learning-materials` bucket. Read happens via short-lived
 * signed URLs created server-side. Write happens via signed upload URLs
 * issued only to admins (see /api/upload-url/+server.ts).
 */
import { supabaseAdmin } from './supabase-admin';

const BUCKET = 'learning-materials';
const READ_TTL_SECONDS = 60 * 10; // 10 minutes

export async function signedReadUrl(path: string, ttl = READ_TTL_SECONDS) {
	const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, ttl);
	if (error) throw error;
	return data.signedUrl;
}

export async function signedUploadUrl(path: string) {
	const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
	if (error) throw error;
	return data;
}
