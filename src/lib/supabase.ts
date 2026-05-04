/**
 * Browser-side Supabase client used ONLY for auth UI helpers (signIn/signUp/
 * signOut, password reset). All data reads/writes go through SvelteKit server
 * load functions and form actions, which use the per-request client built in
 * `hooks.server.ts`.
 */
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
