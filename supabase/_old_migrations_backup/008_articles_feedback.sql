-- 008_articles_feedback.sql
-- Articles 1 and 2 + their feedback threads. Article 2 starts locked.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  pitch_id uuid not null references public.pitches(id) on delete cascade,
  article_number int not null check (article_number in (1, 2)),
  title text not null default '',
  draft text not null default '',
  status article_status not null default 'draft',
  -- Article 1 starts unlocked; article 2 starts locked. Defaults applied
  -- by the trigger below (we cannot put a CASE in a column DEFAULT).
  locked boolean not null default true,
  submitted_at timestamptz,
  supervisor_unlock_by uuid references public.profiles(id) on delete set null,
  supervisor_unlock_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, article_number)
);

create index idx_articles_student on public.articles(student_id);

create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.touch_updated_at();

-- Article 1 unlocked at creation; article 2 locked.
create or replace function public.set_article_initial_lock()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.article_number = 1 then
      new.locked := false;
    else
      new.locked := true;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_articles_initial_lock
  before insert on public.articles
  for each row execute function public.set_article_initial_lock();

alter table public.articles enable row level security;

create policy articles_select on public.articles
  for select using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- Insert allowed when:
--  - admin, or
--  - supervisor of student (creating after pitch selection), or
--  - the student themselves but only when article 1 already exists+approved.
create policy articles_insert on public.articles
  for insert with check (
    public.is_admin()
    or public.is_supervisor_of(student_id)
    or (
      public.is_self(student_id) and exists (
        select 1 from public.articles a
         where a.student_id = articles.student_id
           and a.article_number = 1
           and a.status = 'approved'
      )
    )
  );

-- Update:
--   * student may update their own row only when locked=false AND
--     status in (draft, submitted, revision_requested)
--   * supervisor may update for assigned students (status, locked, draft remains)
--   * admin: anything
create policy articles_update on public.articles
  for update
  using (
    public.is_admin()
    or public.is_supervisor_of(student_id)
    or (public.is_self(student_id))
  )
  with check (
    public.is_admin()
    or public.is_supervisor_of(student_id)
    or (
      public.is_self(student_id)
      and locked = false
      and status in ('draft', 'submitted', 'revision_requested')
    )
  );

create policy articles_delete on public.articles
  for delete using (public.is_admin());

-- Lock guard: only supervisor/admin may flip `locked`.
create or replace function public.enforce_article_lock_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_is_priv boolean;
begin
  v_caller_is_priv := public.is_admin() or public.is_supervisor_of(new.student_id);
  if (old.locked is distinct from new.locked) and not v_caller_is_priv then
    raise exception 'only supervisor or admin may change article lock state';
  end if;
  -- Stamp who unlocked it.
  if old.locked = true and new.locked = false then
    new.supervisor_unlock_by := auth.uid();
    new.supervisor_unlock_at := now();
  end if;
  -- Stamp completed_at on approval.
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_articles_lock_check
  before update on public.articles
  for each row execute function public.enforce_article_lock_changes();

-- ── Article feedback (threaded comments) ────────────────
create table public.article_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_article_feedback_article on public.article_feedback(article_id, created_at desc);

alter table public.article_feedback enable row level security;

-- Read: anyone who can read the article.
create policy article_feedback_select on public.article_feedback
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_id
        and (public.is_self(a.student_id)
             or public.is_supervisor_of(a.student_id)
             or public.is_admin())
    )
  );

-- Insert: supervisor of the student or admin only (not the student).
create policy article_feedback_insert on public.article_feedback
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.articles a
       where a.id = article_id
         and (public.is_supervisor_of(a.student_id) or public.is_admin())
    )
  );

create policy article_feedback_delete on public.article_feedback
  for delete using (public.is_admin() or author_id = auth.uid());
