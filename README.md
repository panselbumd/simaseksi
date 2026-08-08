# SIMASEKSI — Sistem Informasi Manajemen Seleksi Organ BUMD

Next.js 14 (App Router) + Supabase (PostgreSQL, Auth, Storage, Row Level
Security) rebuild of the `index.html` prototype. This README follows the
exact roadmap the prototype itself displays under Settings:

```
index.html → GitHub → Next.js → Supabase → Auth → Storage → PostgreSQL → RLS → Vercel
```

`index.html` is done. Everything below picks up from **GitHub**.

---

## 1. GitHub

```bash
cd simaseksi
git add -A
git commit -m "Initial SIMASEKSI Next.js + Supabase scaffold"

# Create an empty repo on GitHub first (github.com/new — do NOT initialize
# it with a README), then:
git remote add origin https://github.com/<your-org>/simaseksi.git
git branch -M main
git push -u origin main
```

> The repo already has a `.gitignore` covering `node_modules/`, `.next/`,
> `.env*.local`, and `.vercel` — your Supabase keys will never be committed
> as long as you keep them in `.env.local` (see step 3.1).

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Supabase

### 3.1 Create the project & get your keys

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**.
2. Once provisioned, go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never
     expose to the browser)
3. Copy `.env.local.example` to `.env.local` and fill in the three values
   above (plus `SUPABASE_PROJECT_ID`, found in the same Settings page URL).

### 3.2 Apply the database schema (PostgreSQL + RLS)

Dashboard → **SQL Editor** → paste and run, in order:

1. `supabase/schema.sql` — enums, tables, indexes, RLS policies, the
   `write_audit_log()` / `prevent_locked_score_update()` functions, the
   append-only audit trigger, the auto-ranking view `v_candidate_ranking`,
   and the two Storage buckets (`kop-surat`, `candidate-documents`). This
   file already includes the account-roster rules below (single-admin
   unique index, Pansel `posisi`, registration-window-gated applicant
   inserts) — skip step 1b for a brand-new project.
1b. **Existing project only** (schema.sql already applied before this
   update): also run `supabase/migration_0001_akun_dan_pendaftaran.sql`.
   It is idempotent (`if not exists` / `drop policy if exists`), safe to
   run again.
2. `supabase/seed.sql` — demo BUMD, regulations, SOP, one selection, and its
   assessment components. (Tables that reference `auth.users` — profiles,
   applicants, candidates, scores — are seeded separately in step 3.4,
   because those rows can't exist until the matching auth users do.)

Alternatively, with the Supabase CLI linked to your project:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push   # applies schema.sql if placed under supabase/migrations
```

### 3.3 Auth

Supabase Auth is used as-is (email/password) — SIMASEKSI's "single login
gateway, username not email" requirement (prototype spec §10) is implemented
via a `username → synthetic email` mapping:

- Every account's real email is `<username>@simaseksi.local` (never sent
  anything, never shown to the user).
- `public.get_login_email(username)` — a `SECURITY DEFINER` SQL function —
  looks up that email for the login form, so the browser only ever sees the
  username.
- `app/login/actions.ts` calls that RPC, then
  `supabase.auth.signInWithPassword({ email, password })`.

No dashboard configuration is required beyond the default **Email** provider
being enabled (Authentication → Providers — it's on by default). If you'd
rather not deal with a fake TLD, swap `get_login_email` for a real
`user@domain` scheme and adjust the seed script accordingly.

### 3.4 Seed demo users + Storage upload

```bash
# Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from .env.local
npx dotenv -e .env.local -- npx tsx scripts/seed-auth-users.ts
```

This creates the 11 demo accounts required by the account roster spec —
**Admin = 1** (`admin`), **Pansel = 2** (`pansel_ketua`, `pansel_anggota` —
Ketua/Anggota is recorded on `selection_members.posisi`), **Tim UKK = 5**
(`ukk01` … `ukk05`), plus `peserta01`, `kpm`, and `auditor` (same passwords
as the prototype's login screen). It assigns Pansel/Tim UKK/KPM to the demo
selection via `selection_members`, and inserts one sample applicant →
candidate with locked UKK scores so Ranking has something to show
immediately. The `/users` screen shows a live 1/2/5 roster-compliance badge
per role.

Then upload the two letterhead images (already embedded as base64 in
`index.html`) to the public `kop-surat` Storage bucket you created in 3.2:

Dashboard → **Storage → kop-surat → Upload file** →
`KOP_PANSEL_PERUMDAM.png` and `KOP_PANSEL_PT_BWR.png`.

### 3.5 Row Level Security — what's actually enforced

RLS is the real authorization boundary (not the `lib/rbac.ts` map, which is
only a UI convenience for building the sidebar). Highlights, all defined in
`supabase/schema.sql`:

| Rule from the spec | How it's enforced |
|---|---|
| Admin ≠ Selection Authority | `SYSTEM_ADMIN` has **no** UPDATE policy on `assessment_scores`, `recommendations`, or `decisions` — not "hidden in the UI", structurally absent in Postgres. |
| Tim UKK can't see colleagues' scores | `scores_select_own_ukk` filters `SELECT` to `ukk_user_id = auth.uid()` for that role. |
| Scores lock after submit | `scores_update_own_ukk_unlocked` requires `locked = false`, **and** the `prevent_locked_score_update` trigger raises an exception server-side even if RLS were somehow bypassed. |
| Ranking can't be typed in | `v_candidate_ranking` is a view computed from `assessment_scores × assessment_components`; there is no table to write a ranking into. |
| Only KPM/Pejabat Berwenang decide | `decisions_insert_kpm` is the only INSERT policy on `decisions`. |
| Audit trail is append-only | `audit_logs` has a SELECT policy (admin/auditor) and zero UPDATE/DELETE policies; the only INSERT path is the `write_audit_log()` function. |
| Peserta sees only their own data | `applicants`/`candidates`/`documents` SELECT policies include `user_id = auth.uid()`. |
| Admin = exactly 1 account | `uq_single_system_admin` — a partial unique index on `profiles` filtered to `role = 'SYSTEM_ADMIN'` — makes a second admin row impossible, not just a UI-side check. |
| Peserta can only register while registration is open | `applicants_insert_self` requires the target `selections.status = 'REGISTRATION'` in the same query, in Postgres — not just a hidden/disabled UI button. |

### 3.6 Public applicant self-registration (`/daftar`)

`/daftar` and `/daftar/[selectionId]` are **outside** the `(app)` route
group and intentionally excluded from `middleware.ts`'s `isAppRoute` list,
so they stay reachable by anonymous visitors. They list every selection
with `status = 'REGISTRATION'` (via the existing public `selections_select_public`
RLS policy) and let a visitor create their own `PESERTA` account + submit
their `applicants` row in one step (`app/daftar/[selectionId]/actions.ts`).
Because this endpoint is unauthenticated, the role is hard-coded to
`PESERTA` server-side — nothing from the form can request a different role.
The username/password they choose becomes their normal SIMASEKSI login
(`username@simaseksi.local` under the hood, same as every other account).

---

## 4. Run locally

```bash
npm run dev
# http://localhost:3000
```

Login with any demo account from step 3.4, e.g. `pansel` / `pansel123`.

---

## 5. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** →
   select the GitHub repo you pushed in step 1.
2. Framework Preset: **Next.js** (auto-detected).
3. **Environment Variables** — add the same three from `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
4. **Deploy**. Every subsequent `git push` to `main` auto-deploys.

That completes the full chain:
**`index.html` → GitHub → Next.js → Supabase (Auth/Storage/PostgreSQL/RLS) → Vercel.**

---

## 6. What's fully wired vs. scaffolded

**Fully wired end-to-end** (schema + RLS + server actions + UI): Auth/RBAC,
BUMD, Selections, Candidates, Assessment & Scoring (with independent
per-UKK-member locking), auto-computed Ranking, Audit Trail, Regulation
database, and:
- **User Management** — create, **edit** (`/users/[id]/edit`), **delete**
  (permanent, via `deleteUserAction`), and deactivate/reactivate, all admin-
  only and audit-logged. A self-account-lock-out guard prevents an admin
  from deleting/deactivating/demoting their own currently-logged-in account.
- **Public applicant self-registration** (`/daftar`) — see §3.6.
- **Recommendation** (`/recommendation`) — full Draf → Review → Revisi →
  Disetujui → Final workflow. Panitia Seleksi drafts and edits the
  `ringkasan` and submits for review; only KPM / Pejabat Berwenang can
  approve, send back for revision, or finalize (`recs_approve_kpm`).
- **Decision** (`/decision`) — KPM / Pejabat Berwenang only
  (`decisions_insert_kpm`) can issue a decision (`nomor`, `tanggal`)
  referencing a `FINAL` recommendation; a recommendation can only be
  referenced once. Decisions are append-only — no UPDATE/DELETE policy
  exists on `public.decisions`, matching the Audit Trail's design.
- **Announcement** (`/announcement`) — Panitia Seleksi / Administrator
  Sistem can create (as `DRAFT`), publish, archive, revert to draft, and
  delete; everyone else only ever sees `PUBLISHED` announcements, enforced
  by `announcements_select_published`.

**Visual**: every publicly reachable page (`/`, `/login`, `/daftar`,
`/daftar/[selectionId]`, and its `/berhasil` confirmation) now shares a
`PublicBackground` component (`components/PublicBackground.tsx`) — the
Perumdam Among Tirto building photo at `public/images/gedung-perumdam.jpg`,
rendered at 45% opacity, with the existing navy gradient layered on top so
text stays readable. Swap the image file to rebrand; the opacity lives in
the `opacity-45` class on the photo layer.

**Schema + RLS ready, UI not yet built** (present in `index.html` as
client-side simulation, not yet as Next.js pages — all tables and RLS
policies already exist in `supabase/schema.sql`; porting each is the same
three-step pattern used throughout this project): Internal Nomination +
Eligibility Engine UI, Document upload/verification UI (bucket + RLS
policies exist, upload form doesn't yet), Interview module UI, Letter
Generator UI (kop images are ready in Storage), Workflow Builder UI,
Reports/CSV export, Notifications UI, AI Assistant.
1. Server Component reads via the RLS-scoped `createClient()`.
2. Server Action in an adjacent `actions.ts` writes via the same client
   (never the service-role client, except in `users/actions.ts` which is
   the one deliberate exception).
3. Postgres RLS is the actual authorization check — the UI just reflects
   what the query returns.
