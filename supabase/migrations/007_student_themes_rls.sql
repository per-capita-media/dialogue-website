-- 007_student_themes_rls.sql
-- Enable RLS + the enforce_two_themes() trigger. Safe now because:
--   - public.student_themes exists (003)
--   - public.is_admin() exists (005)

alter table public.student_themes enable row level security;

-- ── Read: self, supervisor of self, admin ─────────────────────────────
create policy student_themes_select on public.student_themes
  for select
  using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- ── Insert: self while not locked, or admin (override) ────────────────
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

-- ── Delete: same rule as insert ───────────────────────────────────────
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

-- ── Trigger: must keep exactly 2 themes once locked ───────────────────
-- Uses `var := (SELECT …)` assignment instead of `SELECT … INTO var` because
-- some SQL runners mis-parse the latter as the standalone "SELECT INTO TABLE"
-- statement and complain that the variable name is an undefined relation.
create or replace function public.enforce_two_themes()
returns trigger
language plpgsql
as $$
declare
  v_student uuid := coalesce(new.student_id, old.student_id);
  v_count int;
  v_locked boolean;
begin
  v_count := (
    select count(*) from public.student_themes where student_id = v_student
  );
  v_locked := (
    select themes_locked from public.profiles where id = v_student
  );

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
