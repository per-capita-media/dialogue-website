-- 001_enums_and_helpers.sql
-- Foundation: enums + SECURITY DEFINER helper functions used by every RLS policy.
-- Run this first; everything else depends on it.

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

-- ── Generic updated_at trigger ───────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Role helpers (SECURITY DEFINER, locked search_path) ──
-- These read profiles WITHOUT triggering RLS recursion, so they can be
-- called from RLS policies on the profiles table itself.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_self(uid uuid)
returns boolean
language sql
stable
as $$
  select uid = auth.uid();
$$;

create or replace function public.is_supervisor_of(student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_supervisor_assignments
    where student_id = student and supervisor_id = auth.uid()
  );
$$;

-- compute_stage is created later (after all referenced tables exist).
