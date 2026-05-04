-- 004_assignments.sql
-- Many-to-many: a student can have one or more supervisors (and vice versa).
-- Admin assigns; both sides can see their own rows.

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

alter table public.student_supervisor_assignments enable row level security;

create policy assignments_select on public.student_supervisor_assignments
  for select
  using (
    public.is_self(student_id)
    or public.is_self(supervisor_id)
    or public.is_admin()
  );

-- Only admin can change assignments.
create policy assignments_insert on public.student_supervisor_assignments
  for insert with check (public.is_admin());

create policy assignments_update on public.student_supervisor_assignments
  for update using (public.is_admin()) with check (public.is_admin());

create policy assignments_delete on public.student_supervisor_assignments
  for delete using (public.is_admin());

-- Validate role pairing — no admin can be assigned as a supervisor of nobody, etc.
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
  select role into v_student_role from public.profiles where id = new.student_id;
  select role into v_supervisor_role from public.profiles where id = new.supervisor_id;

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
