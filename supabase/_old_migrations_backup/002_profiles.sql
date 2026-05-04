-- 002_profiles.sql
-- Application profile for every auth.users row. Holds role + onboarding
-- fields + the cached current_stage. RLS allows self read/update,
-- assigned-supervisor read, admin everything.

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

alter table public.profiles enable row level security;

-- Read: self, assigned supervisor, admin.
create policy profiles_select on public.profiles
  for select
  using (
    public.is_self(id)
    or public.is_supervisor_of(id)
    or public.is_admin()
  );

-- Insert: only the matching auth user can insert their own row (post-signup).
-- The role column is not protected here; instead a trigger forces 'student'
-- for self-inserts so signups can never elevate themselves.
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
  -- If the inserter isn't admin, force role/locked/stage to safe defaults.
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

-- Update: self can update *content* fields; admin can update anything.
-- Sensitive fields (role, themes_locked, current_stage) are protected by a
-- BEFORE UPDATE trigger that reverts them unless admin.
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

-- Delete: admin only.
create policy profiles_delete on public.profiles
  for delete using (public.is_admin());
