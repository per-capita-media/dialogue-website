/**
 * Service-role Supabase client. Bypasses RLS entirely. Use ONLY for:
 *   - admin bootstrap (creating the first admin)
 *   - signed upload URL generation for the learning-materials bucket
 *   - audit log writes
 *
 * Never import this file from a route that handles a non-admin session.
 */
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});
