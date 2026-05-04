-- 019_quiz_answer_hardening.sql
-- Students and supervisors need quiz prompts/options, never correct_index.
-- The service-role server scorer still reads public.quiz_questions directly.

drop policy if exists quiz_questions_authed_view on public.quiz_questions;

-- This view is intentionally owner-executed and projects only safe columns.
alter view public.quiz_questions_public set (security_invoker = false);

-- Remove direct client-side reads of the answer-bearing table. Admin access is
-- still available through the admin RLS policy; service_role keeps full grants.
revoke select on public.quiz_questions from anon, authenticated;
grant select on public.quiz_questions_public to authenticated;
