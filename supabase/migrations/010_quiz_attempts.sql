-- 010_quiz_attempts.sql
-- Records student attempts and pass/fail. Students keep retrying until passed.

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  answers jsonb not null,          -- {question_id: chosen_index}
  score int not null check (score between 0 and 100),
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

create index idx_attempts_student_quiz on public.quiz_attempts(student_id, quiz_id, attempted_at desc);

alter table public.quiz_attempts enable row level security;

create policy attempts_select on public.quiz_attempts
  for select using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

create policy attempts_insert on public.quiz_attempts
  for insert with check (public.is_self(student_id));

-- No update; if you want a clean history. Admin can delete if needed.
create policy attempts_admin_delete on public.quiz_attempts
  for delete using (public.is_admin());
