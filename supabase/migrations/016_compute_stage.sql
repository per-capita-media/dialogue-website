-- 016_compute_stage.sql
-- Recomputes profiles.current_stage based on quiz results, pitches, and
-- articles. Wired into triggers so the dashboard always reads a fresh stage.
--
-- All scalar lookups use `var := (SELECT …)` assignment style instead of
-- `SELECT … INTO var` because some Supabase / SQL editor configurations
-- mis-parse the latter as the standalone "SELECT INTO TABLE" statement and
-- complain that the variable name is an undefined relation.

create or replace function public.compute_stage(p_student uuid)
returns student_stage
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_onboarding boolean;
  v_doc_passed boolean;
  v_web_passed boolean;
  v_submitted_count int;
  v_selected_count int;
  v_a1_status article_status;
  v_a2_id uuid;
  v_a2_locked boolean;
  v_a2_status article_status;
begin
  v_onboarding := (select onboarding_complete from public.profiles where id = p_student);
  if not coalesce(v_onboarding, false) then return 'onboarding_incomplete'; end if;

  -- Document quiz pass?
  v_doc_passed := exists (
    select 1 from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    where qa.student_id = p_student and q.type = 'document' and qa.passed
  );
  if not v_doc_passed then return 'document_pending'; end if;

  -- Webinar quiz pass?
  v_web_passed := exists (
    select 1 from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    where qa.student_id = p_student and q.type = 'webinar' and qa.passed
  );
  if not v_web_passed then return 'webinar_pending'; end if;

  -- Pitches.
  v_submitted_count := (
    select count(*) from public.pitches
     where student_id = p_student and status in ('submitted', 'selected', 'rejected')
  );
  v_selected_count := (
    select count(*) from public.pitches
     where student_id = p_student and status = 'selected'
  );

  if v_submitted_count < 5 then return 'pitches_in_progress'; end if;
  if v_selected_count < 2 then return 'awaiting_supervisor_selection'; end if;

  -- Article 1 progression.
  v_a1_status := (
    select status from public.articles
     where student_id = p_student and article_number = 1
  );
  if v_a1_status is null then return 'pitches_selected'; end if;
  if v_a1_status = 'draft' then return 'article_1_unlocked'; end if;
  if v_a1_status = 'submitted' then return 'article_1_submitted'; end if;
  if v_a1_status = 'under_review' then return 'article_1_under_review'; end if;
  if v_a1_status = 'revision_requested' then return 'article_1_revision_requested'; end if;
  -- v_a1_status = 'approved' from here.

  -- Article 2 progression. Pull each scalar separately so we don't need a
  -- record variable (some SQL editors choke on `select * into rec`).
  v_a2_id     := (select id     from public.articles where student_id = p_student and article_number = 2);
  v_a2_locked := (select locked from public.articles where student_id = p_student and article_number = 2);
  v_a2_status := (select status from public.articles where student_id = p_student and article_number = 2);

  if v_a2_id is null then return 'article_1_complete'; end if;
  if v_a2_locked then return 'article_2_locked'; end if;
  if v_a2_status = 'draft' then return 'article_2_unlocked'; end if;
  if v_a2_status = 'submitted' then return 'article_2_submitted'; end if;
  if v_a2_status = 'under_review' then return 'article_2_under_review'; end if;
  if v_a2_status = 'revision_requested' then return 'article_2_revision_requested'; end if;
  if v_a2_status = 'approved' then return 'programme_complete'; end if;

  return 'onboarding_complete';
end;
$$;

-- Trigger function that bumps the cached stage on any related change.
create or replace function public.trg_recompute_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'DELETE' then
      v_student := old.id;
    else
      v_student := new.id;
    end if;
  else
    if tg_op = 'DELETE' then
      v_student := old.student_id;
    else
      v_student := new.student_id;
    end if;
  end if;

  if v_student is not null then
    update public.profiles
       set current_stage = public.compute_stage(v_student)
     where id = v_student;
  end if;
  return null;
end;
$$;

create trigger trg_quiz_attempts_stage
  after insert or update or delete on public.quiz_attempts
  for each row execute function public.trg_recompute_stage();

create trigger trg_pitches_stage
  after insert or update or delete on public.pitches
  for each row execute function public.trg_recompute_stage();

create trigger trg_articles_stage
  after insert or update or delete on public.articles
  for each row execute function public.trg_recompute_stage();

create trigger trg_profiles_stage
  after update of onboarding_complete on public.profiles
  for each row execute function public.trg_recompute_stage();
