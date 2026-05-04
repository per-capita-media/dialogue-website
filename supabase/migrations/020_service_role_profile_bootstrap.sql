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
