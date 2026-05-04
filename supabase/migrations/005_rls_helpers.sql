-- 005_rls_helpers.sql
-- Role-aware helper functions used by every subsequent RLS policy.
-- Defined HERE (not in 001) because SQL-language functions are validated
-- at definition time, so the tables they reference (profiles + assignments)
-- must already exist.
--
-- Both functions are SECURITY DEFINER with search_path locked to public so
-- they can be safely invoked from RLS policies on profiles itself without
-- triggering recursive policy evaluation.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

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
