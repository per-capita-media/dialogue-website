/**
 * One-shot script: create the first admin user.
 *
 * Usage:
 *   npm run create-admin -- --email admin@example.com --password 'a-strong-password' --name "The Admin"
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
	console.error('Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
	process.exit(1);
}

const args = Object.fromEntries(
	process.argv.slice(2).reduce<string[][]>((acc, a, i, arr) => {
		if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
		return acc;
	}, [])
);
const email = args.email;
const password = args.password;
const full_name = args.name ?? 'Admin';
if (!email || !password) {
	console.error('Usage: --email <email> --password <password> [--name "Full Name"]');
	process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: created, error: e1 } = await supabase.auth.admin.createUser({
	email,
	password,
	email_confirm: true
});
if (e1) {
	console.error('createUser failed:', e1.message);
	process.exit(1);
}
const userId = created.user!.id;

const { error: e2 } = await supabase.rpc('bootstrap_profile', {
	p_id: userId,
	p_email: email,
	p_full_name: full_name,
	p_role: 'admin',
	p_onboarding_complete: true
});
if (e2) {
	console.error('profiles upsert failed:', e2.message);
	process.exit(1);
}

console.log(`✓ Admin created: ${email} (id: ${userId})`);
