-- 001_types_and_base_helpers.sql
-- Foundation: enums + generic helpers that have NO table dependencies.
-- Anything referencing public.profiles or public.student_supervisor_assignments
-- lives in 005_rls_helpers.sql so the tables exist first.

-- ── Enums ────────────────────────────────────────────────
create type user_role as enum ('student', 'supervisor', 'admin');

-- Full ladder of student stages, in roughly chronological order.
create type student_stage as enum (
  'onboarding_incomplete',
  'onboarding_complete',
  'document_pending',
  'document_quiz_complete',
  'webinar_pending',
  'webinar_quiz_complete',
  'pitches_in_progress',
  'pitches_submitted',
  'awaiting_supervisor_selection',
  'pitches_selected',
  'article_1_unlocked',
  'article_1_submitted',
  'article_1_under_review',
  'article_1_revision_requested',
  'article_1_complete',
  'article_2_locked',
  'article_2_unlocked',
  'article_2_submitted',
  'article_2_under_review',
  'article_2_revision_requested',
  'article_2_complete',
  'programme_complete'
);

create type material_type as enum ('document', 'webinar');
create type pitch_status as enum ('draft', 'submitted', 'selected', 'rejected');
create type article_status as enum ('draft', 'submitted', 'under_review', 'revision_requested', 'approved');
create type conversation_kind as enum ('student_supervisor', 'admin_student', 'admin_supervisor');

-- ── Generic updated_at trigger (plpgsql, no table refs) ───────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Pure helper: is_self() — no table refs ────────────────────────────
create or replace function public.is_self(uid uuid)
returns boolean
language sql
stable
as $$
  select uid = auth.uid();
$$;
