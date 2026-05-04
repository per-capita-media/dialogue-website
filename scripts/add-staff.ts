/**
 * Bulk-create staff accounts (admins) and print temporary passwords.
 *
 *   npm run add-staff
 *
 * Default behaviour: creates the two cam.ac.uk staff seeded into this script
 * as admins. Re-running is idempotent — existing users are skipped and a
 * notice is printed.
 *
 * Custom emails:
 *   npm run add-staff -- --emails alice@example.com,bob@example.com
 *
 * Custom role:
 *   npm run add-staff -- --role supervisor
 *
 * Notes:
 *   • Admins automatically have access to /supervisor too (the supervisor
 *     layout accepts ['supervisor', 'admin']) — there is no concept of a
 *     user holding two roles in the schema, but admins can do everything a
 *     supervisor can do.
 *   • Each new account gets a random 16-char password printed to stdout.
 *     Share it securely (Signal, password manager); the user should change
 *     it on first sign-in (Supabase doesn't enforce this in MVP — phase 2).
 *   • Confirmation email is skipped (`email_confirm: true`) so the account
 *     is immediately usable.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
	console.error('Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
	process.exit(1);
}

// ── Argument parsing ────────────────────────────────────────────────
const args = Object.fromEntries(
	process.argv.slice(2).reduce<string[][]>((acc, a, i, arr) => {
		if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
		return acc;
	}, [])
);

const DEFAULT_EMAILS = ['aas228@cam.ac.uk', 'sas245@cam.ac.uk'];
const emails = (args.emails ? String(args.emails) : DEFAULT_EMAILS.join(','))
	.split(',')
	.map((e) => e.trim())
	.filter(Boolean);

const role = (args.role ?? 'admin') as 'student' | 'supervisor' | 'admin';
if (!['student', 'supervisor', 'admin'].includes(role)) {
	console.error(`--role must be one of student | supervisor | admin (got ${role})`);
	process.exit(1);
}

// ── Helpers ────────────────────────────────────────────────────────
function tempPassword(): string {
	// 16 chars from a base64url alphabet — strong enough for a one-shot
	// password the user will rotate immediately.
	return randomBytes(12).toString('base64url').slice(0, 16);
}

function deriveName(email: string): string {
	const local = email.split('@')[0];
	return local
		.split(/[._-]/)
		.filter(Boolean)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join(' ');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// ── Main ───────────────────────────────────────────────────────────
const summary: { email: string; status: string; password?: string; userId?: string }[] = [];

for (const email of emails) {
	// Look up existing first.
	const { data: list } = await supabase.auth.admin.listUsers();
	let user = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

	let password: string | undefined;

	if (!user) {
		password = tempPassword();
		const { data, error } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true
		});
		if (error || !data.user) {
			summary.push({ email, status: `ERROR: ${error?.message ?? 'unknown'}` });
			continue;
		}
		user = data.user;
	}

	const { error: profileErr } = await supabase.rpc('bootstrap_profile', {
		p_id: user.id,
		p_email: email,
		p_full_name: deriveName(email),
		p_role: role,
		p_onboarding_complete: role !== 'student'
	});
	if (profileErr) {
		summary.push({ email, status: `ERROR (profile): ${profileErr.message}`, userId: user.id });
		continue;
	}

	summary.push({
		email,
		status: password ? `created as ${role}` : `already existed — role set to ${role}`,
		password,
		userId: user.id
	});
}

// ── Output ─────────────────────────────────────────────────────────
console.log('\nDialogue · staff bootstrap result\n──────────────────────────────────');
for (const r of summary) {
	console.log(`• ${r.email}  →  ${r.status}`);
	if (r.userId) console.log(`    id:       ${r.userId}`);
	if (r.password) console.log(`    password: ${r.password}    (share securely; user should change on first login)`);
}
console.log('');
console.log(
	`Sign-in URL: ${(process.env.PUBLIC_SITE_URL ?? 'http://localhost:5173')}/auth/login`
);
