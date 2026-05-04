-- 014_audit_log.sql
-- Append-only record of admin/supervisor actions. Written via the service-role
-- client (so RLS isn't a barrier on insert), readable only by admins.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_created_at on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

create policy audit_log_admin_select on public.audit_log
  for select using (public.is_admin());

-- No insert policy is needed because the application writes only via the
-- service-role client (which bypasses RLS). Attempted inserts via the
-- anon/auth role are denied by default.
