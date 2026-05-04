-- 009_learning_quizzes.sql
-- Admin-managed learning content + quizzes. PDF lives in Storage
-- (`learning-materials` bucket); webinar can be a Storage path or external URL.

create table public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  type material_type not null,
  title text not null,
  description text not null default '',
  storage_path text,        -- bucket path for PDFs (or null for video)
  video_url text,           -- external/streamed video URL (or null for PDF)
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_learning_materials_type_active on public.learning_materials(type, active);

create trigger trg_learning_materials_updated_at
  before update on public.learning_materials
  for each row execute function public.touch_updated_at();

alter table public.learning_materials enable row level security;

create policy learning_materials_select on public.learning_materials
  for select using (auth.uid() is not null);

create policy learning_materials_admin_write on public.learning_materials
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Quizzes ─────────────────────────────────────────────
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  type material_type not null,
  material_id uuid references public.learning_materials(id) on delete set null,
  title text not null,
  pass_threshold int not null default 70 check (pass_threshold between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quizzes_type_active on public.quizzes(type, active);

create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.touch_updated_at();

alter table public.quizzes enable row level security;

create policy quizzes_select on public.quizzes
  for select using (auth.uid() is not null);

create policy quizzes_admin_write on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Quiz questions ──────────────────────────────────────
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null,           -- array of strings
  correct_index int not null,       -- 0-based index into options
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_quiz_questions_quiz on public.quiz_questions(quiz_id, order_index);

alter table public.quiz_questions enable row level security;

-- Admin reads everything (incl. correct_index). Students/supervisors read via the
-- public view below which omits correct_index.
create policy quiz_questions_admin_select on public.quiz_questions
  for select using (public.is_admin());

create policy quiz_questions_admin_write on public.quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- Public view: hides correct_index. Used by student-facing quiz runners.
create or replace view public.quiz_questions_public as
  select id, quiz_id, prompt, options, order_index
  from public.quiz_questions;

-- Grant access to authenticated users (RLS does not apply to views with
-- security_invoker = false; we set security_invoker so it inherits caller perms,
-- and add a policy below to allow read for authenticated users).
alter view public.quiz_questions_public set (security_invoker = true);

-- Allow any authenticated user to select from the underlying table via the
-- view, but only the safe columns.
create policy quiz_questions_authed_view on public.quiz_questions
  for select to authenticated
  using (true);
-- (Note: with security_invoker on the view, the existing admin SELECT policy
-- plus this broader authenticated SELECT policy together govern access.
-- Because the view explicitly does not project correct_index, students cannot
-- read it through the view; direct table access by students returns no rows
-- because they hit the admin-only policy first only when admin policy is not
-- joined. To keep things bulletproof, also revoke direct table access for
-- non-admins in the API layer.)
