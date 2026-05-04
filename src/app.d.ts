// See https://kit.svelte.dev/docs/types#app
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Profile } from '$lib/types/domain';

declare global {
	namespace App {
		interface Locals {
			/** Per-request RLS-scoped Supabase client (anon key + user JWT cookie). */
			supabase: SupabaseClient;
			/** Resolved auth session, if any. */
			session: Session | null;
			/** Resolved Supabase auth user, if any. */
			user: User | null;
			/** Application profile row (role + onboarding flags), if signed in. */
			profile: Profile | null;
		}

		interface PageData {
			user: User | null;
			profile: Profile | null;
		}

		// interface Error {}
		// interface Platform {}
	}
}

export {};
