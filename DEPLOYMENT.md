# Deployment Checklist

## Local Version

1. Fill `.env` from `.env.example`.
2. Apply migrations in `supabase/migrations` in filename order, or use `supabase/build/all_migrations.sql` on a fresh database only.
3. Create the private `learning-materials` storage bucket.
4. Run `npm run seed` for local fixtures.
5. Run `npm run dev`.

Seed logins:

- `admin@dialogue.local`
- `editor@dialogue.local`
- `teacher@school.test`
- `stu1@dialogue.local`
- `stu2@dialogue.local`

Password for local seed accounts: `dialogue123`.

## Production Version

1. Use a separate Supabase production project.
2. Apply migrations once, in order. Do not run `supabase/build/all_migrations.sql` against an already-initialised database.
3. Do not run `npm run seed` in production.
4. Create the first admin with `npm run create-admin -- --email ... --password ... --name ...`.
5. Configure production env vars:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PUBLIC_SITE_URL`
   - `RESEND_API_KEY`
   - `MAIL_FROM`
6. Configure Supabase Auth redirect URLs for the production domain.
7. Configure SMTP or Resend with a verified sending domain.
8. Keep `learning-materials` private.
9. Run `npm run check`.
10. Run `npm run build`.
11. Deploy to Vercel.
12. Smoke-test student, editor, teacher, and admin accounts.

## Required Manual QA

- Student cannot see another student by URL or query.
- Editor cannot see unassigned students.
- Teacher sees only explicitly linked student progress.
- Admin can assign editors and teachers.
- Student can submit only 5 pitches within locked themes.
- Editor must select exactly 2 pitches.
- Article 2 stays locked until editor/admin unlock.
- Messaging pairs are limited to student-editor, student-admin, teacher-admin, and editor-admin.
