-- 007_pitches.sql
-- Each student fills 5 pitch slots. Theme must be one of the 2 chosen themes.
-- Supervisor (or admin) selects exactly 2 to become Article 1 / Article 2.

create table public.pitches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  slot_index int not null check (slot_index between 1 and 5),
  theme text not null,
  title text not null default '',
  source_material text not null default '',
  research text not null default '',
  proposal text not null default '',
  status pitch_status not null default 'draft',
  selected_by uuid references public.profiles(id) on delete set null,
  selected_at timestamptz,
  article_number int check (article_number in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, slot_index)
);

-- Only one pitch per (student, article_number) when assigned.
create unique index idx_pitches_one_per_article
  on public.pitches(student_id, article_number)
  where article_number is not null;

create index idx_pitches_student on public.pitches(student_id);
create index idx_pitches_status on public.pitches(status);

create trigger trg_pitches_updated_at
  before update on public.pitches
  for each row execute function public.touch_updated_at();

alter table public.pitches enable row level security;

create policy pitches_select on public.pitches
  for select using (
    public.is_self(student_id)
    or public.is_supervisor_of(student_id)
    or public.is_admin()
  );

-- Self insert/update while draft; supervisor/admin update for status changes.
create policy pitches_insert_self on public.pitches
  for insert with check (
    public.is_self(student_id)
    and status = 'draft'
  );

create policy pitches_update_self on public.pitches
  for update
  using (
    public.is_admin()
    or (public.is_self(student_id))
    or public.is_supervisor_of(student_id)
  )
  with check (
    public.is_admin()
    or (public.is_self(student_id) and status in ('draft', 'submitted'))
    or public.is_supervisor_of(student_id)
  );

create policy pitches_delete_self on public.pitches
  for delete using (
    public.is_admin()
    or (public.is_self(student_id) and status = 'draft')
  );

-- Theme must be one of the student's chosen themes.
create or replace function public.enforce_pitch_theme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.student_themes
     where student_id = new.student_id and theme = new.theme
  ) then
    raise exception 'pitch theme % is not one of the student''s chosen themes', new.theme;
  end if;
  return new;
end;
$$;

create trigger trg_pitch_theme_check
  before insert or update on public.pitches
  for each row execute function public.enforce_pitch_theme();

-- Supervisor selection guard: only supervisor/admin may set status='selected'
-- or set article_number. Students can only flip draft<->submitted.
create or replace function public.enforce_pitch_status_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_is_priv boolean;
begin
  v_caller_is_priv := public.is_admin() or public.is_supervisor_of(new.student_id);

  -- Status changes to selected/rejected: privileged only.
  if (old.status is distinct from new.status)
     and new.status in ('selected', 'rejected')
     and not v_caller_is_priv then
    raise exception 'only supervisor or admin may select/reject a pitch';
  end if;

  -- Setting article_number: privileged only.
  if (coalesce(old.article_number, -1) is distinct from coalesce(new.article_number, -1))
     and not v_caller_is_priv then
    raise exception 'only supervisor or admin may assign article_number';
  end if;

  -- When transitioning to selected, stamp selected_by/selected_at.
  if new.status = 'selected' and old.status is distinct from 'selected' then
    new.selected_by := auth.uid();
    new.selected_at := now();
  end if;

  return new;
end;
$$;

create trigger trg_pitch_status_check
  before update on public.pitches
  for each row execute function public.enforce_pitch_status_transitions();
