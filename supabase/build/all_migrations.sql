-- ============================================================
-- supabase/migrations/001_types_and_base_helpers.sql
-- ============================================================
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
-- ============================================================
-- supabase/migrations/002_profiles.sql
-- ============================================================
-- 002_profiles.sql
-- Application profile for every auth.users row.
--
-- Structure-only: just the table, indexes and the touch-updated_at trigger.
-- RLS, the role-protection triggers, and any function that calls is_admin()
-- live in 006_profiles_rls.sql, AFTER the helper functions are defined.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'student',
  email text not null,
  full_name text,
  school_name text,
  year_group text,
  teacher_name text,
  teacher_email text,
  themes_locked boolean not null default false,
  onboarding_complete boolean not null default false,
  current_stage student_stage not null default 'onboarding_incomplete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
-- ============================================================
-- supabase/migrations/003_student_themes.sql
-- ============================================================
-- 003_student_themes.sql
-- Each student picks exactly 2 themes from a fixed list.
--
-- Structure-only: table + indexes + CHECK constraint. RLS and the
-- enforce_two_themes() trigger live in 007_student_themes_rls.sql,
-- AFTER is_admin() exists.

create table public.student_themes (
  student_id uuid not null references public.profiles(id) on delete cascade,
  theme text not null,
  created_at timestamptz not null default now(),
  primary key (student_id, theme),
  constraint student_themes_allowed check (theme in (
    'Economics',
    'History and Politics',
    'Law',
    'Film, Art and Design',
    'Medicine and Biological Sciences',
    'Technology and Artificial Intelligence',
    'Physical Sciences'
  ))
);

create index idx_student_themes_student on public.student_themes(student_id);
-- ============================================================
-- supabase/migrations/004_assignments.sql
-- ============================================================
-- 004_assignments.sql
-- Many-to-many: a student can have one or more supervisors (and vice versa).
--
-- Structure-only: table + indexes. RLS and validate_assignment_roles()
-- live in 008_assignments_rls.sql, AFTER is_admin() exists.

create table public.student_supervisor_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (student_id, supervisor_id)
);

create index idx_assignments_student on public.student_supervisor_assignments(student_id);
create index idx_assignments_supervisor on public.student_supervisor_assignments(supervisor_id);
-- ============================================================
-- supabase/migrations/005_rls_helpers.sql
-- ============================================================
-- 005_rls_helpers.sql
-- Role-aware helper functions used by every subsequent RLS policy.
-- Defined HERE (not in 001) because SQL-language functions are validated
-- at definition time, so the tables they reference (profiles + assignments)
-- must already exist.
--
-- Both functions are SECURITY DEFINER with search_path locked to public so
-- they can be safely invoked from RLS policies on profiles itself without
-- triggering recursive policy evaluation.

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
-- ============================================================
-- supabase/migrations/006_profiles_rls.sql
-- ============================================================
-- 006_profiles_rls.sql
-- Enable RLS on profiles + the role-protection triggers. Safe now because:
--   - public.profiles exists (002)
--   - public.is_admin() exists (005)

alter table public.profiles enable row level security;

-- ── Read: self, assigned supervisor, admin ────────────────────────────
create policy profiles_select on public.profiles
  for select
  using (
    public.is_self(id)
    or public.is_supervisor_of(id)
    or public.is_admin()
  );

-- ── Insert: only the matching auth user can insert their own row.
-- A trigger forces role/locked/stage to safe defaults so signups can never
-- elevate themselves through self-insert.
create policy profiles_insert_self on public.profiles
  for insert
  with check (public.is_self(id) or public.is_admin());

create or replace function public.profiles_force_student_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_admin() then
    new.role := 'student';
    new.themes_locked := false;
    new.onboarding_complete := false;
    new.current_stage := 'onboarding_incomplete';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_force_role
  before insert on public.profiles
  for each row execute function public.profiles_force_student_role();

-- ── Update: self can update content fields; admin anything ───────────
create policy profiles_update_self on public.profiles
  for update
  using (public.is_self(id) or public.is_admin())
  with check (public.is_self(id) or public.is_admin());

create or replace function public.profiles_protect_sensitive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_admin() then
    new.role := old.role;
    new.themes_locked := old.themes_locked;
    new.current_stage := old.current_stage;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_protect_sensitive
  before update on public.profiles
  for each row execute function public.profiles_protect_sensitive();

-- ── Delete: admin only ────────────────────────────────────────────────
create policy profiles_delete on public.profiles
  for delete using (public.is_admin());
-- ============================================================
-- supabase/migrations/007_student_themes_rls.sql
-- ============================================================
-- 007_student_themes_rls.sql
-- Enable RLS + the enforce_two_themes() trigger. Safe now because:
--   - public.student_themes exists (003)
--   - public.is_admin() exists (005)

alter table public.student_themes enable row level security;

-- ── Read: self, supervisor of self, admin ─────────────────────────────
create policy student_themes_select on public.student_themes
  for select
  using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- ── Insert: self while not locked, or admin (override) ────────────────
create policy student_themes_insert on public.student_themes
  for insert
  with check (
    public.is_admin()
    or (
      public.is_self(student_id)
      and not exists (
        select 1 from public.profiles p
        where p.id = student_id and p.themes_locked = true
      )
    )
  );

-- ── Delete: same rule as insert ───────────────────────────────────────
create policy student_themes_delete on public.student_themes
  for delete
  using (
    public.is_admin()
    or (
      public.is_self(student_id)
      and not exists (
        select 1 from public.profiles p
        where p.id = student_id and p.themes_locked = true
      )
    )
  );

-- ── Trigger: must keep exactly 2 themes once locked ───────────────────
-- Uses `var := (SELECT …)` assignment instead of `SELECT … INTO var` because
-- some SQL runners mis-parse the latter as the standalone "SELECT INTO TABLE"
-- statement and complain that the variable name is an undefined relation.
create or replace function public.enforce_two_themes()
returns trigger
language plpgsql
as $$
declare
  v_student uuid := coalesce(new.student_id, old.student_id);
  v_count int;
  v_locked boolean;
begin
  v_count := (
    select count(*) from public.student_themes where student_id = v_student
  );
  v_locked := (
    select themes_locked from public.profiles where id = v_student
  );

  if v_locked and v_count <> 2 and not public.is_admin() then
    raise exception 'student_themes locked: must keep exactly 2 themes';
  end if;
  return null;
end;
$$;

create constraint trigger trg_two_themes
  after insert or delete on public.student_themes
  deferrable initially deferred
  for each row execute function public.enforce_two_themes();
-- ============================================================
-- supabase/migrations/008_assignments_rls.sql
-- ============================================================
-- 008_assignments_rls.sql
-- Enable RLS + role-pairing validation trigger. Safe now because:
--   - public.student_supervisor_assignments exists (004)
--   - public.is_admin() exists (005)

alter table public.student_supervisor_assignments enable row level security;

create policy assignments_select on public.student_supervisor_assignments
  for select
  using (
    public.is_self(student_id)
    or public.is_self(supervisor_id)
    or public.is_admin()
  );

create policy assignments_insert on public.student_supervisor_assignments
  for insert with check (public.is_admin());

create policy assignments_update on public.student_supervisor_assignments
  for update using (public.is_admin()) with check (public.is_admin());

create policy assignments_delete on public.student_supervisor_assignments
  for delete using (public.is_admin());

-- Validate role pairing — student_id must point at a 'student',
-- supervisor_id at a 'supervisor'. Prevents accidental misassignment.
create or replace function public.validate_assignment_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_role user_role;
  v_supervisor_role user_role;
begin
  -- Use `var := (SELECT …)` assignment style — see note in 007.
  v_student_role    := (select role from public.profiles where id = new.student_id);
  v_supervisor_role := (select role from public.profiles where id = new.supervisor_id);

  if v_student_role is null or v_supervisor_role is null then
    raise exception 'assignment references missing profile';
  end if;
  if v_student_role <> 'student' then
    raise exception 'student_id must reference a student profile';
  end if;
  if v_supervisor_role <> 'supervisor' then
    raise exception 'supervisor_id must reference a supervisor profile';
  end if;
  return new;
end;
$$;

create trigger trg_validate_assignment_roles
  before insert or update on public.student_supervisor_assignments
  for each row execute function public.validate_assignment_roles();
-- ============================================================
-- supabase/migrations/009_learning_quizzes.sql
-- ============================================================
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
-- ============================================================
-- supabase/migrations/010_quiz_attempts.sql
-- ============================================================
-- 010_quiz_attempts.sql
-- Records student attempts and pass/fail. Students keep retrying until passed.

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  answers jsonb not null,          -- {question_id: chosen_index}
  score int not null check (score between 0 and 100),
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

create index idx_attempts_student_quiz on public.quiz_attempts(student_id, quiz_id, attempted_at desc);

alter table public.quiz_attempts enable row level security;

create policy attempts_select on public.quiz_attempts
  for select using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

create policy attempts_insert on public.quiz_attempts
  for insert with check (public.is_self(student_id));

-- No update; if you want a clean history. Admin can delete if needed.
create policy attempts_admin_delete on public.quiz_attempts
  for delete using (public.is_admin());
-- ============================================================
-- supabase/migrations/011_pitches.sql
-- ============================================================
-- 011_pitches.sql
-- Each student fills 5 pitch slots. Theme must be one of the 2 chosen themes.
-- Supervisor (or admin) selects exactly 2 to become Article 1 / Article 2.

create table public.pitches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  slot_index int not null check (slot_index between 1 and 5),
  theme text not null,
  title text not null default '',
  source_material text not null default '',
  research text not null default '',
  proposal text not null default '',
  status pitch_status not null default 'draft',
  selected_by uuid references public.profiles(id) on delete set null,
  selected_at timestamptz,
  article_number int check (article_number in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, slot_index)
);

-- Only one pitch per (student, article_number) when assigned.
create unique index idx_pitches_one_per_article
  on public.pitches(student_id, article_number)
  where article_number is not null;

create index idx_pitches_student on public.pitches(student_id);
create index idx_pitches_status on public.pitches(status);

create trigger trg_pitches_updated_at
  before update on public.pitches
  for each row execute function public.touch_updated_at();

alter table public.pitches enable row level security;

create policy pitches_select on public.pitches
  for select using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- Self insert/update while draft; supervisor/admin update for status changes.
create policy pitches_insert_self on public.pitches
  for insert with check (
    public.is_self(student_id)
    and status = 'draft'
  );

create policy pitches_update_self on public.pitches
  for update
  using (
    public.is_admin()
    or (public.is_self(student_id))
    or public.is_supervisor_of(student_id)
  )
  with check (
    public.is_admin()
    or (public.is_self(student_id) and status in ('draft', 'submitted'))
    or public.is_supervisor_of(student_id)
  );

create policy pitches_delete_self on public.pitches
  for delete using (
    public.is_admin()
    or (public.is_self(student_id) and status = 'draft')
  );

-- Theme must be one of the student's chosen themes.
create or replace function public.enforce_pitch_theme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.student_themes
     where student_id = new.student_id and theme = new.theme
  ) then
    raise exception 'pitch theme % is not one of the student''s chosen themes', new.theme;
  end if;
  return new;
end;
$$;

create trigger trg_pitch_theme_check
  before insert or update on public.pitches
  for each row execute function public.enforce_pitch_theme();

-- Supervisor selection guard: only supervisor/admin may set status='selected'
-- or set article_number. Students can only flip draft<->submitted.
create or replace function public.enforce_pitch_status_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_is_priv boolean;
begin
  v_caller_is_priv := public.is_admin() or public.is_supervisor_of(new.student_id);

  -- Status changes to selected/rejected: privileged only.
  if (old.status is distinct from new.status)
     and new.status in ('selected', 'rejected')
     and not v_caller_is_priv then
    raise exception 'only supervisor or admin may select/reject a pitch';
  end if;

  -- Setting article_number: privileged only.
  if (coalesce(old.article_number, -1) is distinct from coalesce(new.article_number, -1))
     and not v_caller_is_priv then
    raise exception 'only supervisor or admin may assign article_number';
  end if;

  -- When transitioning to selected, stamp selected_by/selected_at.
  if new.status = 'selected' and old.status is distinct from 'selected' then
    new.selected_by := auth.uid();
    new.selected_at := now();
  end if;

  return new;
end;
$$;

create trigger trg_pitch_status_check
  before update on public.pitches
  for each row execute function public.enforce_pitch_status_transitions();
-- ============================================================
-- supabase/migrations/012_articles_feedback.sql
-- ============================================================
-- 012_articles_feedback.sql
-- Articles 1 and 2 + their feedback threads. Article 2 starts locked.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  pitch_id uuid not null references public.pitches(id) on delete cascade,
  article_number int not null check (article_number in (1, 2)),
  title text not null default '',
  draft text not null default '',
  status article_status not null default 'draft',
  -- Article 1 starts unlocked; article 2 starts locked. Defaults applied
  -- by the trigger below (we cannot put a CASE in a column DEFAULT).
  locked boolean not null default true,
  submitted_at timestamptz,
  supervisor_unlock_by uuid references public.profiles(id) on delete set null,
  supervisor_unlock_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, article_number)
);

create index idx_articles_student on public.articles(student_id);

create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.touch_updated_at();

-- Article 1 unlocked at creation; article 2 locked.
create or replace function public.set_article_initial_lock()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.article_number = 1 then
      new.locked := false;
    else
      new.locked := true;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_articles_initial_lock
  before insert on public.articles
  for each row execute function public.set_article_initial_lock();

alter table public.articles enable row level security;

create policy articles_select on public.articles
  for select using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- Insert allowed when:
--  - admin, or
--  - supervisor of student (creating after pitch selection), or
--  - the student themselves but only when article 1 already exists+approved.
create policy articles_insert on public.articles
  for insert with check (
    public.is_admin()
    or public.is_supervisor_of(student_id)
    or (
      public.is_self(student_id) and exists (
        select 1 from public.articles a
         where a.student_id = articles.student_id
           and a.article_number = 1
           and a.status = 'approved'
      )
    )
  );

-- Update:
--   * student may update their own row only when locked=false AND
--     status in (draft, submitted, revision_requested)
--   * supervisor may update for assigned students (status, locked, draft remains)
--   * admin: anything
create policy articles_update on public.articles
  for update
  using (
    public.is_admin()
    or public.is_supervisor_of(student_id)
    or (public.is_self(student_id))
  )
  with check (
    public.is_admin()
    or public.is_supervisor_of(student_id)
    or (
      public.is_self(student_id)
      and locked = false
      and status in ('draft', 'submitted', 'revision_requested')
    )
  );

create policy articles_delete on public.articles
  for delete using (public.is_admin());

-- Lock guard: only supervisor/admin may flip `locked`.
create or replace function public.enforce_article_lock_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_is_priv boolean;
begin
  v_caller_is_priv := public.is_admin() or public.is_supervisor_of(new.student_id);
  if (old.locked is distinct from new.locked) and not v_caller_is_priv then
    raise exception 'only supervisor or admin may change article lock state';
  end if;
  -- Stamp who unlocked it.
  if old.locked = true and new.locked = false then
    new.supervisor_unlock_by := auth.uid();
    new.supervisor_unlock_at := now();
  end if;
  -- Stamp completed_at on approval.
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_articles_lock_check
  before update on public.articles
  for each row execute function public.enforce_article_lock_changes();

-- ── Article feedback (threaded comments) ────────────────
create table public.article_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_article_feedback_article on public.article_feedback(article_id, created_at desc);

alter table public.article_feedback enable row level security;

-- Read: anyone who can read the article.
create policy article_feedback_select on public.article_feedback
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_id
        and (public.is_self(a.student_id)
             or public.is_supervisor_of(a.student_id)
             or public.is_admin())
    )
  );

-- Insert: supervisor of the student or admin only (not the student).
create policy article_feedback_insert on public.article_feedback
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.articles a
       where a.id = article_id
         and (public.is_supervisor_of(a.student_id) or public.is_admin())
    )
  );

create policy article_feedback_delete on public.article_feedback
  for delete using (public.is_admin() or author_id = auth.uid());
-- ============================================================
-- supabase/migrations/013_messaging.sql
-- ============================================================
-- 013_messaging.sql
-- Private 1:1 conversations between approved role pairs.
-- Allowed kinds: student↔supervisor, admin↔student, admin↔supervisor.
-- Student↔student is impossible because no kind permits it.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind conversation_kind not null,
  -- Sorted pair so the unique constraint catches both orderings.
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- least() is immutable so it works inside an expression unique index.
  unique (kind, participant_a, participant_b),
  check (participant_a < participant_b)
);

create index idx_conversations_a on public.conversations(participant_a);
create index idx_conversations_b on public.conversations(participant_b);

alter table public.conversations enable row level security;

create policy conversations_select on public.conversations
  for select using (
    public.is_self(participant_a)
    or public.is_self(participant_b)
    or public.is_admin()
  );

-- Insert: the caller must be one of the participants AND the kind must
-- match the role pairing (validated by trigger below).
create policy conversations_insert on public.conversations
  for insert with check (
    public.is_self(participant_a) or public.is_self(participant_b) or public.is_admin()
  );

create policy conversations_delete on public.conversations
  for delete using (public.is_admin());

create or replace function public.validate_conversation_pair()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_a user_role;
  v_role_b user_role;
begin
  -- Use `var := (SELECT …)` assignment style — see note in 007.
  v_role_a := (select role from public.profiles where id = new.participant_a);
  v_role_b := (select role from public.profiles where id = new.participant_b);

  if v_role_a is null or v_role_b is null then
    raise exception 'conversation references missing profile';
  end if;

  -- Validate the kind/role pairing.
  if new.kind = 'student_supervisor' then
    if not ((v_role_a = 'student' and v_role_b = 'supervisor')
         or (v_role_a = 'supervisor' and v_role_b = 'student')) then
      raise exception 'student_supervisor conversation requires one student + one supervisor';
    end if;
    -- The supervisor must be assigned to that student.
    declare s uuid; sup uuid;
    begin
      if v_role_a = 'student' then s := new.participant_a; sup := new.participant_b;
      else s := new.participant_b; sup := new.participant_a; end if;
      if not exists (
        select 1 from public.student_supervisor_assignments
        where student_id = s and supervisor_id = sup
      ) then
        raise exception 'supervisor not assigned to this student';
      end if;
    end;
  elsif new.kind = 'admin_student' then
    if not ((v_role_a = 'admin' and v_role_b = 'student')
         or (v_role_a = 'student' and v_role_b = 'admin')) then
      raise exception 'admin_student conversation requires admin + student';
    end if;
  elsif new.kind = 'admin_supervisor' then
    if not ((v_role_a = 'admin' and v_role_b = 'supervisor')
         or (v_role_a = 'supervisor' and v_role_b = 'admin')) then
      raise exception 'admin_supervisor conversation requires admin + supervisor';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_validate_conversation
  before insert on public.conversations
  for each row execute function public.validate_conversation_pair();

-- ── Messages ────────────────────────────────────────────
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

create policy messages_select on public.messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (public.is_self(c.participant_a) or public.is_self(c.participant_b))
    )
  );

create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (public.is_self(c.participant_a) or public.is_self(c.participant_b) or public.is_admin())
    )
  );

create policy messages_update_read on public.messages
  for update using (
    -- Recipient (the other participant) can stamp read_at.
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (public.is_self(c.participant_a) or public.is_self(c.participant_b))
    )
  );

create policy messages_delete on public.messages
  for delete using (public.is_admin());
-- ============================================================
-- supabase/migrations/014_audit_log.sql
-- ============================================================
-- 014_audit_log.sql
-- Append-only record of admin/supervisor actions. Written via the service-role
-- client (so RLS isn't a barrier on insert), readable only by admins.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_created_at on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

create policy audit_log_admin_select on public.audit_log
  for select using (public.is_admin());

-- No insert policy is needed because the application writes only via the
-- service-role client (which bypasses RLS). Attempted inserts via the
-- anon/auth role are denied by default.
-- ============================================================
-- supabase/migrations/015_storage_policies.sql
-- ============================================================
-- 015_storage_policies.sql
-- Bucket: `learning-materials` (private). Reads happen only via signed URLs
-- generated by the service-role client; writes happen only via the service-role
-- client. So we explicitly DENY all anon / authenticated direct access.

-- NOTE: create the bucket itself in the Supabase dashboard (Storage → New
-- bucket → name `learning-materials`, set "Public" off). Then run this file.

-- Drop any default permissive policies if they exist (Supabase sometimes
-- adds an "Allow all" policy on new private buckets).
do $$
begin
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public Access') then
    execute 'drop policy "Public Access" on storage.objects';
  end if;
exception when others then
  null;
end$$;

-- Read access: only allow signed URLs. SvelteKit calls
-- `supabase.storage.from('learning-materials').createSignedUrl(path, ttl)`
-- on the server using the service-role client; the browser then fetches the
-- short-lived signed URL directly from Storage.
-- The policy below additionally allows authenticated users to list/get
-- objects in this bucket through the regular API _only for read_, so that
-- admin tooling works. Tighten further if you don't need this.
create policy lm_read_authenticated on storage.objects
  for select to authenticated
  using (bucket_id = 'learning-materials');

-- Writes (insert/update/delete) are restricted to admins, executed via the
-- service-role client which already bypasses RLS. Public/anon get nothing.
create policy lm_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'learning-materials' and public.is_admin())
  with check (bucket_id = 'learning-materials' and public.is_admin());
-- ============================================================
-- supabase/migrations/016_compute_stage.sql
-- ============================================================
-- 016_compute_stage.sql
-- Recomputes profiles.current_stage based on quiz results, pitches, and
-- articles. Wired into triggers so the dashboard always reads a fresh stage.
--
-- All scalar lookups use `var := (SELECT …)` assignment style instead of
-- `SELECT … INTO var` because some Supabase / SQL editor configurations
-- mis-parse the latter as the standalone "SELECT INTO TABLE" statement and
-- complain that the variable name is an undefined relation.

create or replace function public.compute_stage(p_student uuid)
returns student_stage
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_onboarding boolean;
  v_doc_passed boolean;
  v_web_passed boolean;
  v_submitted_count int;
  v_selected_count int;
  v_a1_status article_status;
  v_a2_id uuid;
  v_a2_locked boolean;
  v_a2_status article_status;
begin
  v_onboarding := (select onboarding_complete from public.profiles where id = p_student);
  if not coalesce(v_onboarding, false) then return 'onboarding_incomplete'; end if;

  -- Document quiz pass?
  v_doc_passed := exists (
    select 1 from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    where qa.student_id = p_student and q.type = 'document' and qa.passed
  );
  if not v_doc_passed then return 'document_pending'; end if;

  -- Webinar quiz pass?
  v_web_passed := exists (
    select 1 from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    where qa.student_id = p_student and q.type = 'webinar' and qa.passed
  );
  if not v_web_passed then return 'webinar_pending'; end if;

  -- Pitches.
  v_submitted_count := (
    select count(*) from public.pitches
     where student_id = p_student and status in ('submitted', 'selected', 'rejected')
  );
  v_selected_count := (
    select count(*) from public.pitches
     where student_id = p_student and status = 'selected'
  );

  if v_submitted_count < 5 then return 'pitches_in_progress'; end if;
  if v_selected_count < 2 then return 'awaiting_supervisor_selection'; end if;

  -- Article 1 progression.
  v_a1_status := (
    select status from public.articles
     where student_id = p_student and article_number = 1
  );
  if v_a1_status is null then return 'pitches_selected'; end if;
  if v_a1_status = 'draft' then return 'article_1_unlocked'; end if;
  if v_a1_status = 'submitted' then return 'article_1_submitted'; end if;
  if v_a1_status = 'under_review' then return 'article_1_under_review'; end if;
  if v_a1_status = 'revision_requested' then return 'article_1_revision_requested'; end if;
  -- v_a1_status = 'approved' from here.

  -- Article 2 progression. Pull each scalar separately so we don't need a
  -- record variable (some SQL editors choke on `select * into rec`).
  v_a2_id     := (select id     from public.articles where student_id = p_student and article_number = 2);
  v_a2_locked := (select locked from public.articles where student_id = p_student and article_number = 2);
  v_a2_status := (select status from public.articles where student_id = p_student and article_number = 2);

  if v_a2_id is null then return 'article_1_complete'; end if;
  if v_a2_locked then return 'article_2_locked'; end if;
  if v_a2_status = 'draft' then return 'article_2_unlocked'; end if;
  if v_a2_status = 'submitted' then return 'article_2_submitted'; end if;
  if v_a2_status = 'under_review' then return 'article_2_under_review'; end if;
  if v_a2_status = 'revision_requested' then return 'article_2_revision_requested'; end if;
  if v_a2_status = 'approved' then return 'programme_complete'; end if;

  return 'onboarding_complete';
end;
$$;

-- Trigger function that bumps the cached stage on any related change.
create or replace function public.trg_recompute_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'DELETE' then
      v_student := old.id;
    else
      v_student := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      v_student := old.student_id;
    else
      v_student := new.student_id;
    end if;
  end if;

  if v_student is not null then
    update public.profiles
       set current_stage = public.compute_stage(v_student)
     where id = v_student;
  end if;
  return null;
end;
$$;

create trigger trg_quiz_attempts_stage
  after insert or update or delete on public.quiz_attempts
  for each row execute function public.trg_recompute_stage();

create trigger trg_pitches_stage
  after insert or update or delete on public.pitches
  for each row execute function public.trg_recompute_stage();

create trigger trg_articles_stage
  after insert or update or delete on public.articles
  for each row execute function public.trg_recompute_stage();

create trigger trg_profiles_stage
  after update of onboarding_complete on public.profiles
  for each row execute function public.trg_recompute_stage();
-- ============================================================
-- supabase/migrations/017_signup_invitations.sql
-- ============================================================
-- 017_signup_invitations.sql
-- Single-use invitation tokens for elevated-role signups (supervisor / admin).
-- Public student signup remains open at /auth/signup. Supervisor and admin
-- accounts can only be created by redeeming a token issued by an existing
-- admin via /admin/invitations. The very first admin is bootstrapped by
-- scripts/create-admin.ts.

create table public.signup_invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role user_role not null check (role in ('supervisor', 'admin')),
  email text,                                    -- optional hint for the inviter
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id) on delete set null
);

create index idx_signup_invitations_token on public.signup_invitations(token);
create index idx_signup_invitations_pending
  on public.signup_invitations(created_at desc)
  where consumed_at is null;

alter table public.signup_invitations enable row level security;

-- Only admins can read invitations through the user-scoped client. The
-- redemption path uses the service-role client (which bypasses RLS), so an
-- unauthenticated user can be checked against the table during signup
-- without seeing the table's contents.
create policy invitations_admin_select on public.signup_invitations
  for select using (public.is_admin());

create policy invitations_admin_write on public.signup_invitations
  for all using (public.is_admin()) with check (public.is_admin());
-- ============================================================
-- supabase/migrations/018_grants.sql
-- ============================================================
-- 018_grants.sql
-- Restore the standard Supabase grants on the public schema.
--
-- Why this exists: a fresh Supabase project ships with grants like
-- `grant all on all tables in schema public to service_role` plus default
-- privileges so future tables inherit them. If you ever
-- `drop schema public cascade; create schema public;` (e.g. to reapply
-- migrations cleanly), those grants disappear and the service-role key
-- starts hitting "permission denied for table X" — even though service-role
-- is supposed to bypass RLS. RLS bypass and table-level GRANTs are separate
-- things; you still need the GRANT.
--
-- This migration is idempotent — safe to run any number of times.

grant usage on schema public to anon, authenticated, service_role;
grant all   on schema public to postgres, service_role;

-- Existing objects ---------------------------------------------------------
grant all privileges on all tables    in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;
grant all privileges on all functions in schema public to postgres, service_role;

-- anon + authenticated still go through RLS, but they need the table-level
-- DML grant first or RLS never gets a chance to evaluate.
grant select, insert, update, delete on all tables    in schema public to anon, authenticated;
grant usage, select                  on all sequences in schema public to anon, authenticated;

-- Future objects -----------------------------------------------------------
alter default privileges in schema public grant all on tables    to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables    to anon, authenticated;
alter default privileges in schema public grant usage, select                  on sequences to anon, authenticated;
-- ============================================================
-- supabase/migrations/019_quiz_answer_hardening.sql
-- ============================================================
-- 019_quiz_answer_hardening.sql
-- Students and supervisors need quiz prompts/options, never correct_index.
-- The service-role server scorer still reads public.quiz_questions directly.

drop policy if exists quiz_questions_authed_view on public.quiz_questions;

-- This view is intentionally owner-executed and projects only safe columns.
alter view public.quiz_questions_public set (security_invoker = false);

-- Remove direct client-side reads of the answer-bearing table. Admin access is
-- still available through the admin RLS policy; service_role keeps full grants.
revoke select on public.quiz_questions from anon, authenticated;
grant select on public.quiz_questions_public to authenticated;
-- ============================================================
-- supabase/migrations/020_service_role_profile_bootstrap.sql
-- ============================================================
-- 020_service_role_profile_bootstrap.sql
-- Service-role scripts and invitation redemption must be able to create
-- supervisor/admin profiles. Browser-authenticated users are still forced to
-- student on self-signup, and cannot edit role/stage/lock fields.

create or replace function public.profiles_force_student_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_admin() then
    new.role := 'student';
    new.themes_locked := false;
    new.onboarding_complete := false;
    new.current_stage := 'onboarding_incomplete';
  end if;
  return new;
end;
$$;

create or replace function public.profiles_protect_sensitive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.is_admin() then
    new.role := old.role;
    new.themes_locked := old.themes_locked;
    new.current_stage := old.current_stage;
  end if;
  return new;
end;
$$;
-- ============================================================
-- supabase/migrations/021_bootstrap_profile_rpc.sql
-- ============================================================
-- 021_bootstrap_profile_rpc.sql
-- Trusted service-role code needs a narrow way to create/update elevated
-- profiles while ordinary browser-authenticated users remain unable to set
-- role/stage/lock fields.

create or replace function public.profiles_force_student_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.profile_bootstrap', true) = 'on' then
    return new;
  end if;

  if not public.is_admin() then
    new.role := 'student';
    new.themes_locked := false;
    new.onboarding_complete := false;
    new.current_stage := 'onboarding_incomplete';
  end if;
  return new;
end;
$$;

create or replace function public.profiles_protect_sensitive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.profile_bootstrap', true) = 'on' then
    return new;
  end if;

  if not public.is_admin() then
    new.role := old.role;
    new.themes_locked := old.themes_locked;
    new.current_stage := old.current_stage;
  end if;
  return new;
end;
$$;

create or replace function public.bootstrap_profile(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_role user_role,
  p_onboarding_complete boolean default true
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  perform set_config('app.profile_bootstrap', 'on', true);

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    onboarding_complete
  )
  values (
    p_id,
    p_email,
    p_full_name,
    p_role,
    p_onboarding_complete
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    onboarding_complete = excluded.onboarding_complete,
    updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.bootstrap_profile(uuid, text, text, user_role, boolean) from public;
grant execute on function public.bootstrap_profile(uuid, text, text, user_role, boolean) to service_role;
-- ============================================================
-- supabase/migrations/022_fix_stage_trigger_profile_updates.sql
-- ============================================================
-- 022_fix_stage_trigger_profile_updates.sql
-- The original stage trigger referenced NEW.student_id inside an expression
-- that also runs for profiles, where student_id does not exist. Branch before
-- touching table-specific fields so profile onboarding updates can recompute.

create or replace function public.trg_recompute_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'DELETE' then
      v_student := old.id;
    else
      v_student := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      v_student := old.student_id;
    else
      v_student := new.student_id;
    end if;
  end if;

  if v_student is not null then
    update public.profiles
       set current_stage = public.compute_stage(v_student)
     where id = v_student;
  end if;
  return null;
end;
$$;
-- ============================================================
-- supabase/migrations/023_teacher_editor_enum_values.sql
-- ============================================================
-- 023_teacher_editor_enum_values.sql
-- Run this first; PostgreSQL enum values cannot be safely used elsewhere in
-- the same migration transaction in some Supabase runners.

alter type user_role add value if not exists 'teacher';
alter type user_role add value if not exists 'editor';
-- ============================================================
-- supabase/migrations/024_teacher_editor_policies.sql
-- ============================================================
-- 024_teacher_editor_policies.sql
-- Adds teacher/editor policy semantics after the enum values are committed.
-- Existing supervisor accounts remain valid as legacy editor-equivalent staff.

alter table public.signup_invitations
  drop constraint if exists signup_invitations_role_check;

alter table public.signup_invitations
  add constraint signup_invitations_role_check
  check (role in ('supervisor', 'editor', 'teacher', 'admin'));

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

create or replace function public.is_teacher_of(student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles teacher
    join public.profiles pupil
      on lower(pupil.teacher_email) = lower(teacher.email)
    where teacher.id = auth.uid()
      and teacher.role = 'teacher'
      and pupil.id = student
      and pupil.role = 'student'
  );
$$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (
    public.is_self(id)
    or public.is_supervisor_of(id)
    or public.is_teacher_of(id)
    or public.is_admin()
  );

create or replace function public.validate_assignment_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_role user_role;
  v_supervisor_role user_role;
begin
  v_student_role    := (select role from public.profiles where id = new.student_id);
  v_supervisor_role := (select role from public.profiles where id = new.supervisor_id);

  if v_student_role is null or v_supervisor_role is null then
    raise exception 'assignment references missing profile';
  end if;
  if v_student_role <> 'student' then
    raise exception 'student_id must reference a student profile';
  end if;
  if v_supervisor_role not in ('supervisor', 'editor') then
    raise exception 'supervisor_id must reference an editor profile';
  end if;
  return new;
end;
$$;

create or replace function public.validate_conversation_pair()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_a user_role;
  v_role_b user_role;
begin
  v_role_a := (select role from public.profiles where id = new.participant_a);
  v_role_b := (select role from public.profiles where id = new.participant_b);

  if v_role_a is null or v_role_b is null then
    raise exception 'conversation references missing profile';
  end if;

  if new.kind = 'student_supervisor' then
    if not ((v_role_a = 'student' and v_role_b in ('supervisor', 'editor'))
         or (v_role_a in ('supervisor', 'editor') and v_role_b = 'student')) then
      raise exception 'student_supervisor conversation requires one student + one editor';
    end if;
    declare s uuid; sup uuid;
    begin
      if v_role_a = 'student' then s := new.participant_a; sup := new.participant_b;
      else s := new.participant_b; sup := new.participant_a; end if;
      if not exists (
        select 1 from public.student_supervisor_assignments
        where student_id = s and supervisor_id = sup
      ) then
        raise exception 'editor not assigned to this student';
      end if;
    end;
  elsif new.kind = 'admin_student' then
    if not ((v_role_a = 'admin' and v_role_b = 'student')
         or (v_role_a = 'student' and v_role_b = 'admin')) then
      raise exception 'admin_student conversation requires admin + student';
    end if;
  elsif new.kind = 'admin_supervisor' then
    if not ((v_role_a = 'admin' and v_role_b in ('supervisor', 'editor', 'teacher'))
         or (v_role_a in ('supervisor', 'editor', 'teacher') and v_role_b = 'admin')) then
      raise exception 'admin_supervisor conversation requires admin + staff';
    end if;
  end if;
  return new;
end;
$$;
-- ============================================================
-- supabase/migrations/025_teacher_student_links.sql
-- ============================================================
-- 025_teacher_student_links.sql
-- Production teacher access should be explicit. The earlier MVP email-match
-- fallback is replaced with admin-managed teacher/student links.

create table if not exists public.teacher_student_links (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

create index if not exists idx_teacher_links_teacher on public.teacher_student_links(teacher_id);
create index if not exists idx_teacher_links_student on public.teacher_student_links(student_id);

alter table public.teacher_student_links enable row level security;

drop policy if exists teacher_links_select on public.teacher_student_links;
create policy teacher_links_select on public.teacher_student_links
  for select using (
    public.is_admin()
    or public.is_self(teacher_id)
    or public.is_self(student_id)
  );

drop policy if exists teacher_links_insert on public.teacher_student_links;
create policy teacher_links_insert on public.teacher_student_links
  for insert with check (public.is_admin());

drop policy if exists teacher_links_update on public.teacher_student_links;
create policy teacher_links_update on public.teacher_student_links
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists teacher_links_delete on public.teacher_student_links;
create policy teacher_links_delete on public.teacher_student_links
  for delete using (public.is_admin());

create or replace function public.validate_teacher_student_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_role user_role;
  v_student_role user_role;
begin
  v_teacher_role := (select role from public.profiles where id = new.teacher_id);
  v_student_role := (select role from public.profiles where id = new.student_id);

  if v_teacher_role <> 'teacher' then
    raise exception 'teacher_id must reference a teacher profile';
  end if;

  if v_student_role <> 'student' then
    raise exception 'student_id must reference a student profile';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_teacher_student_link on public.teacher_student_links;
create trigger trg_validate_teacher_student_link
  before insert or update on public.teacher_student_links
  for each row execute function public.validate_teacher_student_link();

create or replace function public.is_teacher_of(student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teacher_student_links tsl
    join public.profiles teacher on teacher.id = tsl.teacher_id
    where tsl.student_id = student
      and tsl.teacher_id = auth.uid()
      and teacher.role = 'teacher'
  );
$$;
