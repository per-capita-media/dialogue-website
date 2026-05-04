-- 013_signup_invitations.sql
-- Single-use invitation tokens for elevated-role signups (supervisor / admin).
-- Public student signup remains open at /auth/signup. Supervisor and admin
-- accounts can only be created by redeeming a token issued by an existing
-- admin via /admin/invitations. The very first admin is bootstrapped by
-- scripts/create-admin.ts.

create table public.signup_invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role user_role not null check (role in ('supervisor', 'admin')),
  email text,                                    -- optional hint for the inviter
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id) on delete set null
);

create index idx_signup_invitations_token on public.signup_invitations(token);
create index idx_signup_invitations_pending
  on public.signup_invitations(created_at desc)
  where consumed_at is null;

alter table public.signup_invitations enable row level security;

-- Only admins can read invitations through the user-scoped client. The
-- redemption path uses the service-role client (which bypasses RLS), so an
-- unauthenticated user can be checked against the table during signup
-- without seeing the table's contents.
create policy invitations_admin_select on public.signup_invitations
  for select using (public.is_admin());

create policy invitations_admin_write on public.signup_invitations
  for all using (public.is_admin()) with check (public.is_admin());
