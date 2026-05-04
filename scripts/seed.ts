/**
 * Seed sample users + content for local development.
 *
 *   npm run seed
 *
 * Creates:
 *   - admin@dialogue.local / password: dialogue123
 *   - editor@dialogue.local / password: dialogue123
 *   - teacher@school.test   / password: dialogue123
 *   - stu1@dialogue.local  / password: dialogue123 (theme: Economics, Law)
 *   - stu2@dialogue.local  / password: dialogue123 (theme: Technology and AI, History and Politics)
 *   - links editor -> stu1, stu2
 *   - one document material + 5-question doc quiz (passed-only mock content)
 *   - one webinar material + 5-question webinar quiz
 *
 * Idempotent: safe to re-run.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
	console.error('Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

async function ensureUser(
	email: string,
	password: string,
	fullName: string,
	role: 'student' | 'teacher' | 'supervisor' | 'editor' | 'admin'
) {
	const { data: list } = await sb.auth.admin.listUsers();
	let user = list.users.find((u) => u.email === email);
	if (!user) {
		const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
		if (error) throw error;
		user = data.user!;
	}
	const { error: profileError } = await sb.rpc('bootstrap_profile', {
		p_id: user.id,
		p_email: email,
		p_full_name: fullName,
		p_role: role,
		p_onboarding_complete: role !== 'student'
	});
	if (profileError) throw profileError;
	return user.id;
}

const adminId = await ensureUser('admin@dialogue.local', 'dialogue123', 'Admin User', 'admin');
const supId = await ensureUser('sup1@dialogue.local', 'dialogue123', 'Sam Supervisor', 'supervisor');
const editorId = await ensureUser('editor@dialogue.local', 'dialogue123', 'Eden Editor', 'editor');
const teacherId = await ensureUser('teacher@school.test', 'dialogue123', 'Taylor Teacher', 'teacher');
const stu1Id = await ensureUser('stu1@dialogue.local', 'dialogue123', 'Sara Student', 'student');
const stu2Id = await ensureUser('stu2@dialogue.local', 'dialogue123', 'Sam Student', 'student');

// Themes (must respect themes_locked = false initially; we set locked=true after)
for (const [sid, themes] of [
	[stu1Id, ['Economics', 'Law']],
	[stu2Id, ['Technology and Artificial Intelligence', 'History and Politics']]
] as const) {
	await sb.from('student_themes').delete().eq('student_id', sid);
	await sb.from('student_themes').insert(themes.map((theme) => ({ student_id: sid, theme })));
	await sb.from('profiles').update({ themes_locked: true, onboarding_complete: true, school_name: 'Sample School', year_group: 'Year 12', teacher_name: 'Mr Teacher', teacher_email: 'teacher@school.test' }).eq('id', sid);
}

// Assignments
const { error: assignmentError } = await sb.from('student_supervisor_assignments').upsert(
	[
		{ student_id: stu1Id, supervisor_id: supId, assigned_by: adminId },
		{ student_id: stu2Id, supervisor_id: supId, assigned_by: adminId },
		{ student_id: stu1Id, supervisor_id: editorId, assigned_by: adminId },
		{ student_id: stu2Id, supervisor_id: editorId, assigned_by: adminId }
	],
	{ onConflict: 'student_id,supervisor_id' }
);
if (assignmentError) throw assignmentError;

const { error: teacherLinkError } = await sb.from('teacher_student_links').upsert(
	[
		{ student_id: stu1Id, teacher_id: teacherId, assigned_by: adminId },
		{ student_id: stu2Id, teacher_id: teacherId, assigned_by: adminId }
	],
	{ onConflict: 'teacher_id,student_id' }
);
if (teacherLinkError) throw teacherLinkError;

async function ensureMaterial(payload: {
	type: 'document' | 'webinar';
	title: string;
	description: string;
	active: boolean;
	video_url?: string;
}) {
	const { data: existing, error: selectError } = await sb
		.from('learning_materials')
		.select('*')
		.eq('title', payload.title)
		.maybeSingle();
	if (selectError) throw selectError;
	if (existing) {
		const { data, error } = await sb
			.from('learning_materials')
			.update(payload)
			.eq('id', existing.id)
			.select()
			.single();
		if (error) throw error;
		return data;
	}
	const { data, error } = await sb.from('learning_materials').insert(payload).select().single();
	if (error) throw error;
	return data;
}

async function ensureQuiz(payload: {
	type: 'document' | 'webinar';
	material_id: string | null;
	title: string;
	pass_threshold: number;
	active: boolean;
}) {
	const { data: existing, error: selectError } = await sb
		.from('quizzes')
		.select('*')
		.eq('title', payload.title)
		.maybeSingle();
	if (selectError) throw selectError;
	if (existing) {
		const { data, error } = await sb
			.from('quizzes')
			.update(payload)
			.eq('id', existing.id)
			.select()
			.single();
		if (error) throw error;
		return data;
	}
	const { data, error } = await sb.from('quizzes').insert(payload).select().single();
	if (error) throw error;
	return data;
}

// Materials
const docMat = await ensureMaterial({
	type: 'document',
	title: 'Intro to Investigative Journalism',
	description: 'A short primer.',
	active: true
});
const webMat = await ensureMaterial({
	type: 'webinar',
	title: 'Pitching to Editors — webinar',
	description: 'Recorded webinar.',
	video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
	active: true
});

// Quizzes
const docQuiz = await ensureQuiz({
	type: 'document',
	material_id: docMat.id,
	title: 'Document quiz',
	pass_threshold: 60,
	active: true
});
const webQuiz = await ensureQuiz({
	type: 'webinar',
	material_id: webMat.id,
	title: 'Webinar quiz',
	pass_threshold: 60,
	active: true
});

const docQs = [
	{ prompt: 'What is a primary source?', options: ['First-hand evidence', 'Wikipedia', 'A press release', 'A textbook'], correct_index: 0 },
	{ prompt: 'Who is the inverted pyramid for?', options: ['Editors', 'Readers', 'Sub-editors', 'All of the above'], correct_index: 3 },
	{ prompt: 'Best way to verify a quote?', options: ['Trust the source', 'Recording', 'Ask twice', 'Both 2 and 3'], correct_index: 3 },
	{ prompt: 'A nut graf is…', options: ['A funny line', 'The "so what" paragraph', 'A direct quote', 'A correction'], correct_index: 1 },
	{ prompt: 'Off the record means…', options: ['Don\'t print', 'Print without name', 'Whatever you like', 'Confidential to editor'], correct_index: 0 }
];
await sb.from('quiz_questions').delete().eq('quiz_id', docQuiz.id);
for (let i = 0; i < docQs.length; i++) {
	const { error } = await sb.from('quiz_questions').insert({
		quiz_id: docQuiz.id,
		prompt: docQs[i].prompt,
		options: docQs[i].options,
		correct_index: docQs[i].correct_index,
		order_index: i
	});
	if (error) throw error;
}
const webQs = [
	{ prompt: 'A pitch should lead with…', options: ['Your CV', 'The story', 'Your fees', 'Bibliography'], correct_index: 1 },
	{ prompt: 'Best length of a pitch?', options: ['1 sentence', '~150 words', '5 pages', 'Whatever'], correct_index: 1 },
	{ prompt: 'Editors care about…', options: ['Audience', 'Timeliness', 'Access', 'All'], correct_index: 3 },
	{ prompt: 'Follow-up after pitching?', options: ['Never', '24h', '1 week', 'Daily'], correct_index: 2 },
	{ prompt: 'If rejected…', options: ['Give up', 'Try elsewhere', 'Argue', 'Re-send unchanged'], correct_index: 1 }
];
await sb.from('quiz_questions').delete().eq('quiz_id', webQuiz.id);
for (let i = 0; i < webQs.length; i++) {
	const { error } = await sb.from('quiz_questions').insert({
		quiz_id: webQuiz.id,
		prompt: webQs[i].prompt,
		options: webQs[i].options,
		correct_index: webQs[i].correct_index,
		order_index: i
	});
	if (error) throw error;
}

for (const sid of [stu1Id, stu2Id]) {
	const { data: stage, error } = await sb.rpc('compute_stage', { p_student: sid });
	if (error) throw error;
	await sb.from('profiles').update({ current_stage: stage }).eq('id', sid);
}

console.log('✓ Seed complete.');
console.log('Login as: admin@dialogue.local · editor@dialogue.local · teacher@school.test · stu1@dialogue.local · stu2@dialogue.local');
console.log('Password (all): dialogue123');
