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
