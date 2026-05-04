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
