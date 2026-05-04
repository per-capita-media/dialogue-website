-- seed.sql
-- Minimal sample content. Run AFTER you have manually created (in Supabase
-- Auth dashboard) the following users and grabbed their UUIDs:
--   admin@example.com         → ADMIN_UUID
--   supervisor1@example.com   → SUP_UUID
--   student1@example.com      → STU1_UUID
--   student2@example.com      → STU2_UUID
--
-- Then `psql` against the Supabase URL and run this file with the UUIDs
-- substituted, OR use `scripts/seed.ts` which does this for you.
--
-- This file is illustrative; prefer `scripts/seed.ts` for a real bootstrap.

-- Profiles ---------------------------------------------------------
-- (run AFTER editing the UUIDs)
-- insert into public.profiles (id, role, email, full_name)
-- values ('ADMIN_UUID', 'admin', 'admin@example.com', 'The Admin');
-- insert into public.profiles (id, role, email, full_name)
-- values ('SUP_UUID', 'supervisor', 'supervisor1@example.com', 'Sam Supervisor');
-- insert into public.profiles (id, role, email, full_name)
-- values ('STU1_UUID', 'student', 'student1@example.com', 'Sara Student');

-- Sample learning material + quizzes -------------------------------
insert into public.learning_materials (id, type, title, description, video_url, active)
values
  (gen_random_uuid(), 'document', 'Introduction to Investigative Journalism',
   'Read this primer before attempting the document quiz.',
   null, true),
  (gen_random_uuid(), 'webinar', 'Pitching to Editors — recorded webinar',
   'Watch the full recording, then take the quiz.',
   'https://www.youtube.com/embed/dQw4w9WgXcQ', true);

-- Sample quiz (document) — populate questions through the admin UI
-- after creation. The admin/quizzes/[id]/edit page handles this.
