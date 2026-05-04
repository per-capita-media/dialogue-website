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
