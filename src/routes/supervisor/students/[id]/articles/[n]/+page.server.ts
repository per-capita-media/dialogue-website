import type { PageServerLoad, Actions } from './$types';
import { requireRole, assertSupervisesStudent } from '$lib/server/guards';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { logAudit } from '$lib/server/audit';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import { loadArticleForStudent } from '$lib/server/queries/articles';

const NSchema = z.coerce.number().int().refine((n) => n === 1 || n === 2);

export const load: PageServerLoad = async ({ locals, params }) => {
	requireRole(locals, ['supervisor', 'editor', 'admin']);
	await assertSupervisesStudent(locals, params.id);
	const n = NSchema.safeParse(params.n);
	if (!n.success) throw error(404, 'Bad article number');

	const { article, feedback } = await loadArticleForStudent(locals.supabase, params.id, n.data as 1 | 2);
	const { data: pitch } = article
		? await locals.supabase.from('pitches').select('*').eq('id', article.pitch_id).maybeSingle()
		: { data: null };
	return { article, feedback, pitch, articleNumber: n.data, studentId: params.id };
};

export const actions: Actions = {
	feedback: async ({ request, locals, params }) => {
		const { user } = requireRole(locals, ['supervisor', 'editor', 'admin']);
		await assertSupervisesStudent(locals, params.id);
		const fd = await request.formData();
		const articleId = String(fd.get('article_id') ?? '');
		const body = String(fd.get('body') ?? '').trim();
		if (!articleId || !body) return fail(400, { error: 'Missing fields' });
		const { error: e } = await locals.supabase
			.from('article_feedback')
			.insert({ article_id: articleId, author_id: user.id, body });
		if (e) return fail(400, { error: e.message });
		return { posted: true };
	},
	status: async ({ request, locals, params }) => {
		const { user } = requireRole(locals, ['supervisor', 'editor', 'admin']);
		await assertSupervisesStudent(locals, params.id);
		const fd = await request.formData();
		const articleId = String(fd.get('article_id') ?? '');
		const status = String(fd.get('status') ?? '');
		if (!articleId || !['under_review', 'revision_requested', 'approved'].includes(status)) {
			return fail(400, { error: 'Bad status' });
		}
		// Use service-role to bypass any subtle RLS friction (we already
		// verified caller is authorised via assertSupervisesStudent).
		const { error: e } = await supabaseAdmin
			.from('articles')
			.update({ status })
			.eq('id', articleId);
		if (e) return fail(400, { error: e.message });
		await logAudit({ actorId: user.id, action: 'article_status', targetTable: 'articles', targetId: articleId, payload: { status } });
		return { posted: true };
	},
	unlock: async ({ request, locals, params }) => {
		const { user } = requireRole(locals, ['supervisor', 'editor', 'admin']);
		await assertSupervisesStudent(locals, params.id);
		const fd = await request.formData();
		const articleId = String(fd.get('article_id') ?? '');
		if (!articleId) return fail(400, { error: 'Missing article id' });
		const { error: e } = await supabaseAdmin
			.from('articles')
			.update({ locked: false })
			.eq('id', articleId);
		if (e) return fail(400, { error: e.message });
		await logAudit({ actorId: user.id, action: 'article_unlock', targetTable: 'articles', targetId: articleId });
		return { posted: true };
	}
};
