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
