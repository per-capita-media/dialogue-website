-- 003_student_themes.sql
-- Each student picks exactly 2 themes from a fixed list.
--
-- Structure-only: table + indexes + CHECK constraint. RLS and the
-- enforce_two_themes() trigger live in 007_student_themes_rls.sql,
-- AFTER is_admin() exists.

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
