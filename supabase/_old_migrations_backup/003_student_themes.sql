-- 003_student_themes.sql
-- Each student picks exactly 2 themes from a fixed list. Once locked, they
-- cannot change them themselves; admin override is allowed.

create table public.student_themes (
  student_id uuid not null references public.profiles(id) on delete cascade,
  theme text not null,
  created_at timestamptz not null default now(),
  primary key (student_id, theme),
  constraint student_themes_allowed check (theme in (
    'Economics',
    'History and Politics',
    'Law',
    'Film, Art and Design',
    'Medicine and Biological Sciences',
    'Technology and Artificial Intelligence',
    'Physical Sciences'
  ))
);

create index idx_student_themes_student on public.student_themes(student_id);

alter table public.student_themes enable row level security;

-- Read: self, supervisor of self, admin.
create policy student_themes_select on public.student_themes
  for select
  using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- Insert: self while not locked, or admin (override).
create policy student_themes_insert on public.student_themes
  for insert
  with check (
    public.is_admin()
    or (
      public.is_self(student_id)
      and not exists (
        select 1 from public.profiles p
        where p.id = student_id and p.themes_locked = true
      )
    )
  );

-- Delete: same rule as insert.
create policy student_themes_delete on public.student_themes
  for delete
  using (
    public.is_admin()
    or (
      public.is_self(student_id)
      and not exists (
        select 1 from public.profiles p
        where p.id = student_id and p.themes_locked = true
      )
    )
  );

-- A student must have exactly 2 themes once locked. Enforced by trigger
-- because Postgres can't express row-count constraints declaratively.
create or replace function public.enforce_two_themes()
returns trigger
language plpgsql
as $$
declare
  v_count int;
  v_locked boolean;
begin
  -- Use coalesce because OLD is null on insert and NEW is null on delete.
  select count(*) into v_count
    from public.student_themes
   where student_id = coalesce(new.student_id, old.student_id);

  select themes_locked into v_locked
    from public.profiles
   where id = coalesce(new.student_id, old.student_id);

  -- Once locked, the row count must remain 2 unless admin acts.
  if v_locked and v_count <> 2 and not public.is_admin() then
    raise exception 'student_themes locked: must keep exactly 2 themes';
  end if;
  return null;
end;
$$;

create constraint trigger trg_two_themes
  after insert or delete on public.student_themes
  deferrable initially deferred
  for each row execute function public.enforce_two_themes();
