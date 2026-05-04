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
