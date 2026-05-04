/**
 * Domain types — kept intentionally small. Source of truth is the Postgres
 * schema; these mirror only the columns the SvelteKit code actually consumes.
 */

export type Role = 'student' | 'teacher' | 'supervisor' | 'editor' | 'admin';

export type StudentStage =
	| 'onboarding_incomplete'
	| 'onboarding_complete'
	| 'document_pending'
	| 'document_quiz_complete'
	| 'webinar_pending'
	| 'webinar_quiz_complete'
	| 'pitches_in_progress'
	| 'pitches_submitted'
	| 'awaiting_supervisor_selection'
	| 'pitches_selected'
	| 'article_1_unlocked'
	| 'article_1_submitted'
	| 'article_1_under_review'
	| 'article_1_revision_requested'
	| 'article_1_complete'
	| 'article_2_locked'
	| 'article_2_unlocked'
	| 'article_2_submitted'
	| 'article_2_under_review'
	| 'article_2_revision_requested'
	| 'article_2_complete'
	| 'programme_complete';

export type MaterialType = 'document' | 'webinar';
export type PitchStatus = 'draft' | 'submitted' | 'selected' | 'rejected';
export type ArticleStatus = 'draft' | 'submitted' | 'under_review' | 'revision_requested' | 'approved';
export type ConversationKind = 'student_supervisor' | 'admin_student' | 'admin_supervisor';

export interface Profile {
	id: string;
	role: Role;
	email: string;
	full_name: string | null;
	school_name: string | null;
	year_group: string | null;
	teacher_name: string | null;
	teacher_email: string | null;
	themes_locked: boolean;
	onboarding_complete: boolean;
	current_stage: StudentStage;
	created_at: string;
	updated_at: string;
}

export interface StudentTheme {
	student_id: string;
	theme: string;
	created_at: string;
}

export interface Pitch {
	id: string;
	student_id: string;
	slot_index: number;
	theme: string;
	title: string;
	source_material: string;
	research: string;
	proposal: string;
	status: PitchStatus;
	selected_by: string | null;
	selected_at: string | null;
	article_number: 1 | 2 | null;
	created_at: string;
	updated_at: string;
}

export interface Article {
	id: string;
	student_id: string;
	pitch_id: string;
	article_number: 1 | 2;
	title: string;
	draft: string;
	status: ArticleStatus;
	locked: boolean;
	submitted_at: string | null;
	supervisor_unlock_by: string | null;
	supervisor_unlock_at: string | null;
	completed_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ArticleFeedback {
	id: string;
	article_id: string;
	author_id: string;
	body: string;
	created_at: string;
}

export interface LearningMaterial {
	id: string;
	type: MaterialType;
	title: string;
	description: string;
	storage_path: string | null;
	video_url: string | null;
	version: number;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Quiz {
	id: string;
	type: MaterialType;
	material_id: string | null;
	title: string;
	pass_threshold: number;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface QuizQuestion {
	id: string;
	quiz_id: string;
	prompt: string;
	options: string[];
	order_index: number;
	correct_index?: number; // only present when read by admin
}

export interface QuizAttempt {
	id: string;
	student_id: string;
	quiz_id: string;
	answers: Record<string, number>;
	score: number;
	passed: boolean;
	attempted_at: string;
}

export interface Conversation {
	id: string;
	kind: ConversationKind;
	participant_a: string;
	participant_b: string;
	created_at: string;
}

export interface Message {
	id: string;
	conversation_id: string;
	sender_id: string;
	body: string;
	read_at: string | null;
	created_at: string;
}

export interface Assignment {
	id: string;
	student_id: string;
	supervisor_id: string;
	assigned_by: string | null;
	assigned_at: string;
}
