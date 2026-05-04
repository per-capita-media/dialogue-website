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
