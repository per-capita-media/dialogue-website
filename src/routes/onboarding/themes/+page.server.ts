import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guards';
import { ALL_THEMES } from '$lib/constants/themes';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = requireUser(locals);
	const { data } = await locals.supabase
		.from('student_themes')
		.select('theme')
		.eq('student_id', user.id);
	return {
		all: ALL_THEMES,
		chosen: (data ?? []).map((r) => r.theme as string)
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = requireUser(locals);
		const fd = await request.formData();
		const themes = fd.getAll('themes').map(String);

		if (themes.length !== 2) {
			return fail(400, { error: 'You must choose exactly 2 themes.', themes });
		}
		const allowed = new Set<string>(ALL_THEMES);
		if (themes.some((t) => !allowed.has(t))) {
			return fail(400, { error: 'Unknown theme.', themes });
		}

		// Replace existing rows.
		const del = await locals.supabase.from('student_themes').delete().eq('student_id', user.id);
		if (del.error) return fail(500, { error: del.error.message, themes });

		const ins = await locals.supabase
			.from('student_themes')
			.insert(themes.map((theme) => ({ student_id: user.id, theme })));
		if (ins.error) return fail(500, { error: ins.error.message, themes });

		// Lock and mark onboarding complete. The protection trigger reverts
		// `themes_locked` / `onboarding_complete` for non-admin updaters, so we
		// use the service-role client here. This is a controlled, audited
		// transition (student can only flip themselves to "locked + complete"
		// after passing the validation above).
		const { supabaseAdmin } = await import('$lib/server/supabase-admin');
		const upd = await supabaseAdmin
			.from('profiles')
			.update({ themes_locked: true, onboarding_complete: true })
			.eq('id', user.id);
		if (upd.error) return fail(500, { error: upd.error.message, themes });

		throw redirect(303, '/student');
	}
};
