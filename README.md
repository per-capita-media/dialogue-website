# Dialogue — Intro to Journalism

A secure, role-based MVP for a journalism training scheme.

- **Stack:** SvelteKit 2 (Svelte 5) · TypeScript · Tailwind 3 · Supabase (Auth + Postgres + Storage) · Vercel adapter
- **Roles:** `student`, `supervisor`, `admin`
- **Defence in depth:** every protected SvelteKit layout calls a `requireRole(...)` guard, _and_ every Postgres table has Row-Level Security enforcing the same rules.

## Workflow

1. Student signs up → fills profile → picks **2 themes** (locked).
2. Reads a document and passes a multiple-choice quiz.
3. Watches a webinar and passes a quiz.
4. Submits **5 pitches** within their two themes.
5. Supervisor selects exactly **2 pitches** (lower slot becomes Article 1, the other Article 2; Article 2 starts locked).
6. Student drafts and submits Article 1; supervisor leaves feedback.
7. Supervisor (or admin) **unlocks Article 2**; student writes & submits.
8. Throughout, students can message their supervisor and admins. Admins can view & participate in everything.

## Architecture

```
src/
  hooks.server.ts             ← per-request RLS-scoped Supabase client + session/profile
  app.css                     ← design system (cards, buttons, inputs)
  lib/
    server/
      supabase-admin.ts       ← service-role client (admin tasks only)
      guards.ts               ← requireUser / requireRole / requireOnboardingComplete / assertSupervisesStudent
      audit.ts                ← logAudit() — append-only audit trail
      storage.ts              ← signed read/upload URLs
      queries/                ← typed query helpers
    components/               ← Nav, Footer, ThemeToggle, StageBadge, PitchCard, etc.
    constants/themes.ts       ← fixed list of allowed themes (matches DB CHECK)
    stages.ts                 ← stage labels + tone for badges
    roles.ts                  ← dashboardForRole() + role labels
    types/domain.ts           ← TS shapes mirroring the DB
    supabase.ts               ← browser client (auth UI only)
  routes/
    +layout.{svelte,server.ts}
    +page.svelte              ← marketing landing
    auth/{signup,login,logout,callback}
    onboarding/{profile,themes}
    student/                  ← dashboard, learning, pitches, articles, messages
    supervisor/               ← dashboard, students/[id]/{pitches, articles/[n]}, messages
    admin/                    ← stats, students, supervisors, assignments, themes,
                                 pitches, articles, messages, learning-materials,
                                 quizzes, audit-log
    api/{upload-url, signed-asset/[...path]}
supabase/
  migrations/                 ← 001 → 012 (enums, profiles, themes, assignments,
                                materials/quizzes, attempts, pitches, articles,
                                messaging, audit log, storage policies, compute_stage)
  seed.sql                    ← optional sample content
scripts/
  create-admin.ts             ← bootstrap the first admin
  seed.ts                     ← idempotent dev seed (users, materials, quizzes)
```

## Local setup

1. Install deps:

   ```bash
   npm install
   ```

2. Create a Supabase project. Copy `.env.example` to `.env` and fill in:

   ```
   PUBLIC_SUPABASE_URL=…
   PUBLIC_SUPABASE_ANON_KEY=…
   SUPABASE_SERVICE_ROLE_KEY=…
   ```

   **Coming from a Next.js project / new Supabase key naming?**

   - SvelteKit only honours the `PUBLIC_` prefix for browser-exposed vars
     (it ignores `NEXT_PUBLIC_*`). Just rename in your `.env`:
     - `NEXT_PUBLIC_SUPABASE_URL` → `PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → `PUBLIC_SUPABASE_ANON_KEY`
   - Supabase recently renamed the keys; the values are interchangeable:
     - "publishable key" (`sb_publishable_…`) = "anon key" → `PUBLIC_SUPABASE_ANON_KEY`
     - "secret key" (`sb_secret_…`) = "service_role key" → `SUPABASE_SERVICE_ROLE_KEY`
   - You **do** still need the secret/service-role key — it is used for the
     create-admin script, audit log writes, Storage uploads, and a small
     number of one-way state transitions (documented at each call site).
     Grab it from Supabase Dashboard → Project Settings → API.

3. Run the migrations against your Supabase Postgres. Easiest: paste the
   pre-concatenated `supabase/build/all_migrations.sql` into the Supabase
   SQL editor and click **Run**. Otherwise paste each `supabase/migrations/00X_*.sql`
   in order, 001 → 017.

   The migration files are deliberately split by concern so they apply in a
   dependency-safe order (types → tables → role helpers → RLS → triggers →
   feature tables → invitations + storage policies → compute_stage). If you
   ever add a new migration, follow the same rule: any function used in RLS
   must only reference tables defined in earlier files.

4. In the Supabase dashboard, create a **private** Storage bucket named `learning-materials`. Then run `supabase/migrations/011_storage_policies.sql`.

5. Bootstrap an admin (or seed sample data):

   ```bash
   npm run create-admin -- --email you@example.com --password 'a-strong-password' --name 'You'
   # or, for a full local dev fixture:
   npm run seed
   # or, for the two cam.ac.uk staff accounts (admins by default):
   npm run add-staff
   ```

   **`add-staff`** generates a strong random password for each new account
   and prints it to the console — share securely (Signal / password manager)
   and ask the recipient to change it on first sign-in. Re-running is
   idempotent (existing users are kept; the role is re-asserted).

6. Start the dev server:

   ```bash
   npm run dev
   ```

   Visit http://localhost:5173.

## Email invitations (Resend)

Supervisor and admin invitations are issued from `/admin/invitations`. By
default each invitation just creates a row in the database and shows you the
URL to copy. If you also configure **Resend** (free tier covers MVP volume),
the URL is emailed to the recipient automatically.

### Enable email sending

1. Sign up at https://resend.com.
2. Either verify your sending domain (recommended for production) **or** for
   quick testing use the pre-verified test address `onboarding@resend.dev`
   (Resend will only let you send to email addresses associated with your
   Resend account in this mode — perfect for testing with `salhananusha@gmail.com`).
3. Create an API key in the Resend dashboard.
4. Add to `.env`:

   ```
   RESEND_API_KEY=re_xxx
   MAIL_FROM="Dialogue Invitations <onboarding@resend.dev>"
   ```

5. Restart `npm run dev`.

### Test the email flow with `salhananusha@gmail.com`

1. Sign in as an admin (e.g. one created by `npm run add-staff`).
2. Visit **`/admin/invitations`**.
3. The "Send invitation email now" checkbox should be enabled (if it's
   greyed out the mailer isn't configured — see the alert at the top of the
   page; check your env vars and restart `dev`).
4. Fill in: role = `supervisor`, recipient email = `salhananusha@gmail.com`,
   expires in = `7` days. Submit.
5. You should see a green "Invitation created. Email sent ✓" alert.
6. Check the recipient inbox. The email contains an "Accept invitation"
   button linking to `/auth/signup/supervisor?token=…`.
7. If the email never arrives, check the table — the URL is still there for
   manual sharing, and you can click **Resend email** on the row.

> **Resend test-mode caveat:** while using `onboarding@resend.dev`, Resend
> only delivers to email addresses on the same Resend account. Add
> `salhananusha@gmail.com` to your Resend account first (or verify a real
> sending domain) before testing.

## Three-role onboarding flows

The app has **one open public signup (student)** and **two invitation-only flows
(supervisor, admin)**. Self-service for the elevated roles is intentionally not
possible — anyone signing up as a supervisor would gain access to students' work.

### Bootstrap the very first admin

```bash
npm run create-admin -- --email you@example.com --password 'a-strong-password' --name 'You'
```

Then sign in at `/auth/login`. You will land on `/admin` and see a "Getting started"
checklist with the next steps below.

### First admin checklist

1. **Sign in as the admin** you just created.
2. Visit **`/admin/learning-materials/new`** → upload a primer PDF (or paste a video URL for
   the webinar).
3. Visit **`/admin/quizzes/new`** → create one document quiz with at least 3 questions
   (use the question editor on the quiz detail page after creation). Repeat for a webinar quiz.
4. Visit **`/admin/invitations`** → New → role = `supervisor` → copy the URL → send it to your
   supervisor.
5. Wait for students to sign up at **`/auth/signup`**. They will appear in **`/admin/students`**.
6. Visit **`/admin/assignments`** → link your supervisor to each student. The supervisor will
   immediately see those students on `/supervisor`.

The Getting Started card on `/admin` ticks off these steps as you do them.

### First supervisor checklist

1. The admin sends you an invitation URL of the form
   `https://your-app/auth/signup/supervisor?token=…`.
2. Open it, fill in name + password → submit.
3. You land on **`/supervisor`** with the list of students assigned to you (initially empty
   until the admin links some).
4. Once a student has submitted all 5 pitches, open the student → **Pitches** → select exactly
   two. They become Article 1 and Article 2 (Article 2 locked).
5. Read Article 1 drafts → leave feedback → status `revision_requested` or `approved`.
6. Click **Unlock Article 2** to open the second piece for the student.

### First student checklist

1. Sign up at **`/auth/signup`** (the dominant card). Confirm your email if prompted.
2. Fill in your **profile** (school, year group, teacher contact).
3. Pick **exactly 2 themes** — these lock once submitted (an admin can override later).
4. Read the **document** → take the **document quiz** (you can retry until you pass).
5. Watch the **webinar** → take the **webinar quiz**.
6. Submit **5 pitches** across your two themes.
7. Wait for your supervisor to select two. Article 1 unlocks first.
8. Draft and submit **Article 1**. Read feedback. Iterate if revisions are requested.
9. **Article 2** unlocks once your supervisor (or an admin) opens it. Draft and submit.

If you ever lose track of the next step, the **landing page (`/`)** and the **sidebar of
your dashboard** both show a stage-aware "Next: …" hint with a one-click CTA.

## Verification (end-to-end)

After `npm run seed` you can:

1. Sign in as `stu1@dialogue.local` / `dialogue123`. The dashboard already shows themes and the learning steps. Take both quizzes (questions are real — the seed has correct answers in the DB).
2. Submit 5 pitches across the two themes.
3. Sign in as `sup1@dialogue.local`. You should see `stu1` and `stu2` in your supervisor dashboard. Pick exactly 2 pitches — Article 1 + Article 2 rows are created (Article 2 locked).
4. As `stu1`, draft and submit Article 1. As `sup1`, leave feedback, mark approved, and click **Unlock article 2**.
5. As `stu1`, write & submit Article 2.
6. Sign in as `admin@dialogue.local` to see global tables and the audit log.

### RLS isolation check

Even if you bypassed the SvelteKit guards, the database would refuse cross-student reads. Confirm with `psql` or the Supabase SQL editor (in "Run as authenticated user" mode):

```sql
-- Set the session role to a specific student.
select auth.uid();      -- whoever you signed in as in the SQL editor
-- Should return zero rows when run as student stu2 reading stu1's data:
select * from pitches where student_id = '<stu1 uuid>';
```

## Deployment (Vercel + Supabase)

1. Create the Supabase project (cloud) and run the migrations + storage bucket setup above.
2. Push this repo to GitHub.
3. Import the repo into Vercel — framework preset is detected as **SvelteKit**.
4. In Vercel project settings → Environment Variables, set:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. In Supabase → Authentication → URL Configuration:
   - **Site URL:** `https://<your-project>.vercel.app`
   - **Redirect URLs:** include both `https://<your-project>.vercel.app/auth/callback` and `http://localhost:5173/auth/callback`.
6. Deploy. Visit the URL and sign up / sign in.
7. Enable Supabase database backups (daily) and rotate the service-role key periodically.

## Phase 2 (intentionally not in MVP)

- Email notifications & stage-transition emails (Resend / SES).
- Rich-text editor for pitches/articles (TipTap).
- PDF export of pitches/articles.
- File attachments on messages.
- Group chat / multi-supervisor message threads.
- Analytics dashboards.
- 2FA / passkeys / SSO.
- Soft-delete & restore.
- Full-text search across pitches/articles.
- i18n.

## Security notes

- **Service-role key** is server-only (`$env/static/private`) and is used only for: bootstrap, signed Storage URLs, audit-log writes, and a small set of state transitions where the per-row RLS would otherwise require granting the user too much (e.g. flipping `themes_locked` true after onboarding). Each such use is documented at the call site.
- **Browser** never touches the service role. The browser-side Supabase client uses only the anon key and only for auth UI helpers (`signIn`, `signUp`, `signOut`).
- **Every protected SvelteKit layout** calls `requireRole(...)`; every page action re-checks `assertSupervisesStudent` where applicable.
- **Every table** has RLS enabled with policies keyed on `auth.uid()` and helper SECURITY DEFINER functions (`is_admin`, `is_self`, `is_supervisor_of`).
- **Article 2 is locked at insert** (trigger). Only supervisor/admin can flip `locked` (trigger + RLS).
- **Conversation kinds** are validated by trigger so `student↔student` is unrepresentable.

## License

Internal use only — not for redistribution.
