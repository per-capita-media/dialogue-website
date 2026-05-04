-- 018_grants.sql
-- Restore the standard Supabase grants on the public schema.
--
-- Why this exists: a fresh Supabase project ships with grants like
-- `grant all on all tables in schema public to service_role` plus default
-- privileges so future tables inherit them. If you ever
-- `drop schema public cascade; create schema public;` (e.g. to reapply
-- migrations cleanly), those grants disappear and the service-role key
-- starts hitting "permission denied for table X" — even though service-role
-- is supposed to bypass RLS. RLS bypass and table-level GRANTs are separate
-- things; you still need the GRANT.
--
-- This migration is idempotent — safe to run any number of times.

grant usage on schema public to anon, authenticated, service_role;
grant all   on schema public to postgres, service_role;

-- Existing objects ---------------------------------------------------------
grant all privileges on all tables    in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;
grant all privileges on all functions in schema public to postgres, service_role;

-- anon + authenticated still go through RLS, but they need the table-level
-- DML grant first or RLS never gets a chance to evaluate.
grant select, insert, update, delete on all tables    in schema public to anon, authenticated;
grant usage, select                  on all sequences in schema public to anon, authenticated;

-- Future objects -----------------------------------------------------------
alter default privileges in schema public grant all on tables    to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables    to anon, authenticated;
alter default privileges in schema public grant usage, select                  on sequences to anon, authenticated;
