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
