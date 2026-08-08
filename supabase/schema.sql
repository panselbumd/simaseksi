-- ============================================================================
-- SIMASEKSI — Supabase PostgreSQL Schema
-- Sistem Informasi Manajemen Seleksi Organ BUMD — Kota Batu
--
-- Run order: this file, then supabase/seed.sql (optional demo data).
-- Apply via: Supabase Dashboard -> SQL Editor -> paste & run,
--            or: supabase db push  (Supabase CLI, requires linked project)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
create type app_role as enum (
  'SYSTEM_ADMIN', 'PANITIA_SELEKSI', 'TIM_UKK', 'PESERTA', 'KPM', 'PEJABAT_BERWENANG', 'AUDITOR'
);
create type selection_type as enum ('OPEN_SELECTION', 'INTERNAL_SELECTION');
create type candidate_source as enum ('PUBLIC_REGISTRATION', 'INTERNAL_PEMDA', 'NOMINATION', 'OTHER');
create type selection_status as enum (
  'DRAFT','PLANNED','PUBLISHED','REGISTRATION','VERIFICATION','UKK',
  'INTERVIEW','FINALIZATION','COMPLETED','ARCHIVED'
);
create type applicant_status as enum ('VERIFICATION', 'CANDIDATE', 'REJECTED');
create type nomination_status as enum ('UNDER_REVIEW', 'CANDIDATE', 'REJECTED');
create type eligibility_result as enum ('PASS', 'FAIL', 'NEEDS_REVIEW', 'N_A');
create type doc_status as enum (
  'NOT_UPLOADED','UPLOADED','UNDER_REVIEW','VALID','INVALID','REVISION_REQUIRED','APPROVED'
);
create type recommendation_status as enum ('DRAFT', 'REVIEW', 'REVISION', 'APPROVED', 'FINAL');
create type announcement_status as enum ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
create type regulation_status as enum ('VERIFIED', 'REFERENCE', 'DRAFT', 'NEEDS_VALIDATION', 'ARCHIVED');

-- ----------------------------------------------------------------------------
-- 2. PROFILES (extends auth.users) + ROLE
-- ----------------------------------------------------------------------------
-- SIMASEKSI logs in with a USERNAME (per spec, single login gateway — no
-- separate pages per role). Supabase Auth is email/password at its core, so
-- each username is mapped to a synthetic, unlisted email
-- (username@simaseksi.local) at account-creation time. See get_login_email()
-- below for the lookup used by the login form.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  name         text not null,
  role         app_role not null,
  unit         text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
comment on table public.profiles is 'One row per SIMASEKSI user. id mirrors auth.users.id.';

alter table public.profiles enable row level security;

-- Helper: current user's role, without recursive RLS lookups (SECURITY DEFINER)
create or replace function public.current_role()
returns app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() = 'SYSTEM_ADMIN';
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin() or public.current_role() = 'AUDITOR');

-- Admin manages accounts (create/deactivate/reset) — but see rbac.ts: admin
-- must never be granted UPDATE on substantive tables (scores, decisions...).
create policy "profiles_admin_manage"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Username -> synthetic email lookup for the login form (pre-auth, so it must
-- be SECURITY DEFINER and expose nothing except the email of an active user).
create or replace function public.get_login_email(p_username text)
returns text
language sql stable security definer set search_path = public as $$
  select (username || '@simaseksi.local')
  from public.profiles
  where username = p_username and active = true;
$$;
revoke all on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. MASTER DATA — BUMD, REGULATION, SOP
-- ----------------------------------------------------------------------------
create table public.bumds (
  id                  uuid primary key default gen_random_uuid(),
  nama                text not null,
  bentuk_badan_hukum  text,
  tahun_berdiri       int,
  bidang_usaha        text,
  alamat              text,
  website             text,
  status              text not null default 'AKTIF',
  deskripsi           text,
  kop_image_path      text,   -- Supabase Storage path in the 'kop-surat' bucket
  created_at          timestamptz not null default now()
);
alter table public.bumds enable row level security;
create policy "bumds_select_all" on public.bumds for select using (true);
create policy "bumds_manage_admin" on public.bumds for all
  using (public.is_admin()) with check (public.is_admin());

create table public.regulations (
  id          uuid primary key default gen_random_uuid(),
  kategori    text not null,          -- UU, PP, Permendagri, Perda, Perwali, Juklak, Juknis, SOP...
  judul       text not null,
  nomor       text,
  tahun       int,
  status      regulation_status not null default 'DRAFT',
  tag         text[] default '{}',
  catatan     text,                   -- e.g. 'NEEDS REGULATORY VALIDATION'
  created_at  timestamptz not null default now()
);
alter table public.regulations enable row level security;
create policy "regulations_select_all" on public.regulations for select using (true);
create policy "regulations_manage_admin" on public.regulations for all
  using (public.is_admin()) with check (public.is_admin());

create table public.sops (
  id          uuid primary key default gen_random_uuid(),
  kode        text unique not null,
  nama        text not null,
  unit_kerja  text,
  dasar_hukum text,
  pic         text,
  durasi      text,
  status      text not null default 'DRAFT',
  version     text not null default '0.1',
  created_at  timestamptz not null default now()
);
alter table public.sops enable row level security;
create policy "sops_select_all" on public.sops for select using (true);
create policy "sops_manage_panitia_admin" on public.sops for all
  using (public.current_role() in ('SYSTEM_ADMIN','PANITIA_SELEKSI'))
  with check (public.current_role() in ('SYSTEM_ADMIN','PANITIA_SELEKSI'));

-- ----------------------------------------------------------------------------
-- 4. SELECTIONS & WORKFLOW
-- ----------------------------------------------------------------------------
create table public.selections (
  id                uuid primary key default gen_random_uuid(),
  nama              text not null,
  bumd_id           uuid not null references public.bumds(id),
  jabatan           text not null,             -- Direksi | Dewan Pengawas | Komisaris
  tahun             int not null,
  formasi           int not null default 1,
  selection_type    selection_type not null,
  candidate_source  candidate_source not null,
  dasar_hukum       text,
  start_date        date,
  end_date          date,
  status            selection_status not null default 'DRAFT',
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now()
);

-- Panitia/Tim UKK assignment to a selection (drives RLS scope everywhere else)
create table public.selection_members (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  member_role   app_role not null,             -- PANITIA_SELEKSI | TIM_UKK | KPM
  unique (selection_id, user_id, member_role)
);

create or replace function public.is_selection_member(p_selection_id uuid, p_roles app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.selection_members
    where selection_id = p_selection_id and user_id = auth.uid() and member_role = any(p_roles)
  );
$$;

alter table public.selections enable row level security;
alter table public.selection_members enable row level security;

-- Read: broadly visible to authenticated staff roles + assigned peserta (see candidates policy for peserta scope)
create policy "selections_select_staff"
  on public.selections for select
  using (
    public.current_role() in ('SYSTEM_ADMIN','AUDITOR','KPM','PEJABAT_BERWENANG')
    or public.is_selection_member(id, array['PANITIA_SELEKSI','TIM_UKK']::app_role[])
  );
-- Public (anonymous) can read published selections for the public website
create policy "selections_select_public"
  on public.selections for select
  using (status not in ('DRAFT'));

create policy "selections_manage_panitia"
  on public.selections for insert
  with check (public.current_role() = 'PANITIA_SELEKSI');
create policy "selections_update_panitia"
  on public.selections for update
  using (public.current_role() = 'PANITIA_SELEKSI' and public.is_selection_member(id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.current_role() = 'PANITIA_SELEKSI');

create policy "selection_members_select"
  on public.selection_members for select
  using (public.current_role() in ('SYSTEM_ADMIN','AUDITOR') or user_id = auth.uid()
         or public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));
create policy "selection_members_manage_panitia"
  on public.selection_members for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]) or public.current_role()='SYSTEM_ADMIN')
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]) or public.current_role()='SYSTEM_ADMIN');

create table public.selection_stages (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  name          text not null,
  "order"       int not null,
  role          app_role not null default 'PANITIA_SELEKSI',
  required      boolean not null default true,
  status        text not null default 'PENDING',   -- PENDING | ACTIVE | DONE
  start_date    date,
  end_date      date
);
alter table public.selection_stages enable row level security;
create policy "stages_select" on public.selection_stages for select
  using (exists (select 1 from public.selections s where s.id = selection_id));  -- inherits selections' broad readability intent
create policy "stages_manage_panitia" on public.selection_stages for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]) or public.current_role()='SYSTEM_ADMIN')
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]) or public.current_role()='SYSTEM_ADMIN');

create table public.schedules (
  id             uuid primary key default gen_random_uuid(),
  selection_id   uuid not null references public.selections(id) on delete cascade,
  stage_id       uuid references public.selection_stages(id) on delete set null,
  kegiatan       text not null,
  tanggal_mulai  date,
  tanggal_selesai date,
  lokasi         text,
  status         text not null default 'PENDING'
);
alter table public.schedules enable row level security;
create policy "schedules_select" on public.schedules for select using (true);
create policy "schedules_manage_panitia" on public.schedules for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]) or public.current_role()='SYSTEM_ADMIN')
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]) or public.current_role()='SYSTEM_ADMIN');

-- ----------------------------------------------------------------------------
-- 5. APPLICANTS (Open Selection) / INTERNAL NOMINATIONS / CANDIDATES
-- ----------------------------------------------------------------------------
create table public.applicants (
  id                  uuid primary key default gen_random_uuid(),
  selection_id        uuid not null references public.selections(id) on delete cascade,
  user_id             uuid references public.profiles(id),   -- linked once the peserta account exists
  nama                text not null,
  nik_dummy           text,
  tempat_lahir        text,
  tanggal_lahir       date,
  pendidikan_terakhir text,
  pengalaman_tahun    int,
  jabatan_terakhir    text,
  email               text,
  telepon             text,
  status              applicant_status not null default 'VERIFICATION',
  catatan_verifikasi  text,
  submitted_at        timestamptz not null default now()
);
alter table public.applicants enable row level security;
create policy "applicants_select_staff"
  on public.applicants for select
  using (
    public.current_role() in ('SYSTEM_ADMIN','AUDITOR','KPM','PEJABAT_BERWENANG')
    or public.is_selection_member(selection_id, array['PANITIA_SELEKSI','TIM_UKK']::app_role[])
    or user_id = auth.uid()
  );
create policy "applicants_insert_self"
  on public.applicants for insert
  with check (user_id = auth.uid() and public.current_role() = 'PESERTA');
create policy "applicants_update_self_draft"
  on public.applicants for update
  using (user_id = auth.uid() and status = 'VERIFICATION')
  with check (user_id = auth.uid());
create policy "applicants_update_panitia"
  on public.applicants for update
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

create table public.internal_nominations (
  id                    uuid primary key default gen_random_uuid(),
  selection_id          uuid not null references public.selections(id) on delete cascade,
  user_id               uuid references public.profiles(id),
  nama                  text not null,
  nip_dummy             text,
  jabatan               text,
  unit_kerja            text,
  perangkat_daerah      text,
  pangkat_golongan      text,
  jenjang_jabatan       text,
  pendidikan            text,
  pengalaman_tahun      int,
  riwayat_jabatan       text,
  kompetensi            text,
  status_kepegawaian    text,
  status_eligibility    text not null default 'NEEDS_REVIEW',
  konflik_kepentingan   text,
  integritas            text,
  catatan_verifikasi    text,
  status_nominasi       nomination_status not null default 'UNDER_REVIEW'
);
alter table public.internal_nominations enable row level security;
create policy "nominations_select_staff"
  on public.internal_nominations for select
  using (
    public.current_role() in ('SYSTEM_ADMIN','AUDITOR','KPM','PEJABAT_BERWENANG')
    or public.is_selection_member(selection_id, array['PANITIA_SELEKSI','TIM_UKK']::app_role[])
    or user_id = auth.uid()
  );
create policy "nominations_manage_panitia"
  on public.internal_nominations for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

create table public.eligibility_rules (
  id                     uuid primary key default gen_random_uuid(),
  selection_id           uuid not null references public.selections(id) on delete cascade,
  rule                   text not null,
  requirement            text not null,
  regulatory_reference   text,
  active                 boolean not null default true
);
alter table public.eligibility_rules enable row level security;
create policy "elig_rules_select" on public.eligibility_rules for select using (true);
create policy "elig_rules_manage_panitia" on public.eligibility_rules for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

create table public.eligibility_assessments (
  id           uuid primary key default gen_random_uuid(),
  nominee_id   uuid not null references public.internal_nominations(id) on delete cascade,
  rule_id      uuid not null references public.eligibility_rules(id) on delete cascade,
  result       eligibility_result not null default 'NEEDS_REVIEW',
  evidence     text,
  verifier     uuid references public.profiles(id),
  "timestamp"  timestamptz not null default now(),
  unique (nominee_id, rule_id)
);
alter table public.eligibility_assessments enable row level security;
create policy "elig_assess_select" on public.eligibility_assessments for select using (true);
create policy "elig_assess_manage_panitia" on public.eligibility_assessments for all
  using (exists (select 1 from public.internal_nominations n where n.id = nominee_id
                 and public.is_selection_member(n.selection_id, array['PANITIA_SELEKSI']::app_role[])))
  with check (true);

create table public.candidates (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  source_type   text not null check (source_type in ('APPLICANT','INTERNAL_NOMINEE')),
  source_id     uuid not null,
  user_id       uuid references public.profiles(id),
  nama          text not null,
  status        text not null default 'ACTIVE'
);
alter table public.candidates enable row level security;
create policy "candidates_select_staff"
  on public.candidates for select
  using (
    public.current_role() in ('SYSTEM_ADMIN','AUDITOR','KPM','PEJABAT_BERWENANG')
    or public.is_selection_member(selection_id, array['PANITIA_SELEKSI','TIM_UKK']::app_role[])
    or user_id = auth.uid()
  );
create policy "candidates_manage_panitia" on public.candidates for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

-- ----------------------------------------------------------------------------
-- 6. DOCUMENTS
-- ----------------------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  owner_type    text not null check (owner_type in ('APPLICANT','NOMINEE')),
  owner_id      uuid not null,
  selection_id  uuid not null references public.selections(id) on delete cascade,
  jenis         text not null,
  status        doc_status not null default 'NOT_UPLOADED',
  storage_path  text,        -- Supabase Storage path in the 'candidate-documents' bucket
  verifier      uuid references public.profiles(id),
  tanggal       date,
  catatan       text
);
alter table public.documents enable row level security;
create policy "documents_select_staff"
  on public.documents for select
  using (
    public.current_role() in ('SYSTEM_ADMIN','AUDITOR','KPM','PEJABAT_BERWENANG')
    or public.is_selection_member(selection_id, array['PANITIA_SELEKSI','TIM_UKK']::app_role[])
    or exists (select 1 from public.applicants a where a.id = owner_id and a.user_id = auth.uid())
    or exists (select 1 from public.internal_nominations n where n.id = owner_id and n.user_id = auth.uid())
  );
create policy "documents_insert_owner"
  on public.documents for insert
  with check (
    exists (select 1 from public.applicants a where a.id = owner_id and a.user_id = auth.uid())
    or exists (select 1 from public.internal_nominations n where n.id = owner_id and n.user_id = auth.uid())
  );
create policy "documents_verify_panitia"
  on public.documents for update
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

-- ----------------------------------------------------------------------------
-- 7. UKK, ASSESSMENT COMPONENTS & SCORING (independent, lockable)
-- ----------------------------------------------------------------------------
create table public.assessment_components (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  name          text not null,
  weight        numeric not null check (weight >= 0 and weight <= 100),
  max_score     numeric not null default 100,
  min_score     numeric not null default 0,
  required      boolean not null default true,
  active        boolean not null default true
);
alter table public.assessment_components enable row level security;
create policy "components_select" on public.assessment_components for select using (true);
create policy "components_manage_panitia" on public.assessment_components for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

create table public.assessments (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  candidate_id  uuid not null references public.candidates(id) on delete cascade,
  ukk_user_id   uuid not null references public.profiles(id),
  status        text not null default 'DRAFT',   -- DRAFT | LOCKED
  unique (selection_id, candidate_id, ukk_user_id)
);
alter table public.assessments enable row level security;

create table public.assessment_scores (
  id              uuid primary key default gen_random_uuid(),
  selection_id    uuid not null references public.selections(id) on delete cascade,
  candidate_id    uuid not null references public.candidates(id) on delete cascade,
  component_id    uuid not null references public.assessment_components(id) on delete cascade,
  ukk_user_id     uuid not null references public.profiles(id),
  score           numeric check (score >= 0 and score <= 100),
  locked          boolean not null default false,
  submitted_at    timestamptz,
  updated_at      timestamptz not null default now(),
  unique (candidate_id, component_id, ukk_user_id)
);
alter table public.assessment_scores enable row level security;

-- *** CRITICAL BUSINESS RULE ***
-- A Tim UKK member may only see their OWN scores (never a colleague's raw
-- input) — independence of assessment. Staff roles below see the full matrix
-- for aggregation/ranking, but crucially get NO update/delete policy at all,
-- so panitia, KPM, and especially SYSTEM_ADMIN structurally cannot alter a
-- score — matching "Admin ≠ Selection Authority" and "raw score protection".
create policy "scores_select_own_ukk"
  on public.assessment_scores for select
  using (
    (public.current_role() = 'TIM_UKK' and ukk_user_id = auth.uid())
    or public.current_role() in ('SYSTEM_ADMIN','AUDITOR','PANITIA_SELEKSI','KPM','PEJABAT_BERWENANG')
  );
create policy "scores_insert_own_ukk"
  on public.assessment_scores for insert
  with check (
    public.current_role() = 'TIM_UKK' and ukk_user_id = auth.uid()
    and public.is_selection_member(selection_id, array['TIM_UKK']::app_role[])
  );
-- Update allowed ONLY while unlocked, and only by the owning UKK member.
create policy "scores_update_own_ukk_unlocked"
  on public.assessment_scores for update
  using (public.current_role() = 'TIM_UKK' and ukk_user_id = auth.uid() and locked = false)
  with check (ukk_user_id = auth.uid());
-- No delete policy at all -> scores can never be removed (append + correction
-- workflow only, mirroring the prototype's "don't delete old values" rule).

create policy "assessments_select"
  on public.assessments for select
  using (
    (public.current_role() = 'TIM_UKK' and ukk_user_id = auth.uid())
    or public.current_role() in ('SYSTEM_ADMIN','AUDITOR','PANITIA_SELEKSI','KPM','PEJABAT_BERWENANG')
  );
create policy "assessments_upsert_own_ukk"
  on public.assessments for insert
  with check (public.current_role() = 'TIM_UKK' and ukk_user_id = auth.uid());
create policy "assessments_update_own_ukk"
  on public.assessments for update
  using (public.current_role() = 'TIM_UKK' and ukk_user_id = auth.uid())
  with check (ukk_user_id = auth.uid());

-- Server-side guard: once an assessment is LOCKED, its scores cannot be
-- updated even by the owning UKK member (defense in depth alongside the
-- locked=false RLS check above).
create or replace function public.prevent_locked_score_update()
returns trigger language plpgsql as $$
begin
  if old.locked = true then
    raise exception 'Nilai sudah terkunci. Gunakan alur Correction Request untuk mengajukan koreksi.';
  end if;
  return new;
end;
$$;
create trigger trg_prevent_locked_score_update
  before update on public.assessment_scores
  for each row execute function public.prevent_locked_score_update();

-- View: ranking is ALWAYS computed, never hand-entered (spec: "Ranking tidak
-- boleh diinput manual"). Weighted Score = avg(score across UKK members per
-- component) * weight / 100, summed across components.
create or replace view public.v_candidate_ranking as
select
  c.selection_id,
  c.id as candidate_id,
  c.nama,
  round(sum(comp_avg.avg_score * ac.weight / 100.0)::numeric, 2) as final_score,
  bool_and(comp_avg.has_score) as complete,
  rank() over (partition by c.selection_id order by sum(comp_avg.avg_score * ac.weight / 100.0) desc) as ranking
from public.candidates c
join public.assessment_components ac on ac.selection_id = c.selection_id and ac.active
left join lateral (
  select avg(s.score) as avg_score, count(s.score) > 0 as has_score
  from public.assessment_scores s
  where s.candidate_id = c.id and s.component_id = ac.id and s.score is not null
) comp_avg on true
group by c.selection_id, c.id, c.nama;
comment on view public.v_candidate_ranking is
  'Auto-computed ranking per selection — never manually editable. Mirrors the prototype''s computeCandidateFinalScore()/Ranking Engine.';

-- ----------------------------------------------------------------------------
-- 8. INTERVIEW / RECOMMENDATION / DECISION / ANNOUNCEMENT
-- ----------------------------------------------------------------------------
create table public.interviews (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  candidate_id  uuid not null references public.candidates(id) on delete cascade,
  tanggal       date,
  pewawancara   text,
  catatan       text,
  skor          numeric,
  rekomendasi   text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
alter table public.interviews enable row level security;
create policy "interviews_select" on public.interviews for select using (true);
create policy "interviews_manage_panitia" on public.interviews for all
  using (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]))
  with check (public.is_selection_member(selection_id, array['PANITIA_SELEKSI']::app_role[]));

create table public.recommendations (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  status        recommendation_status not null default 'DRAFT',
  ringkasan     text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
alter table public.recommendations enable row level security;
create policy "recs_select" on public.recommendations for select using (true);
create policy "recs_insert_update_panitia"
  on public.recommendations for insert
  with check (public.current_role() = 'PANITIA_SELEKSI');
create policy "recs_update_panitia_draft"
  on public.recommendations for update
  using (public.current_role() = 'PANITIA_SELEKSI' and status in ('DRAFT','REVISION'))
  with check (public.current_role() = 'PANITIA_SELEKSI');
-- Only KPM / Pejabat Berwenang may move DRAFT/REVIEW -> APPROVED or REVISION
-- (the actual "recommendation.approve" permission). Enforced in application
-- layer + this policy: they may update status regardless of current status.
create policy "recs_approve_kpm"
  on public.recommendations for update
  using (public.current_role() in ('KPM','PEJABAT_BERWENANG'))
  with check (public.current_role() in ('KPM','PEJABAT_BERWENANG'));

create table public.decisions (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id),
  nomor         text not null,
  tanggal       date not null default current_date,
  status        text not null default 'FINALIZED',
  decided_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
alter table public.decisions enable row level security;
create policy "decisions_select" on public.decisions for select using (true);
-- Only KPM / Pejabat Berwenang may issue decisions — never Admin, never Panitia.
create policy "decisions_insert_kpm"
  on public.decisions for insert
  with check (public.current_role() in ('KPM','PEJABAT_BERWENANG'));

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text,
  selection_id  uuid references public.selections(id) on delete set null,
  content       text,
  publish_date  date,
  status        announcement_status not null default 'DRAFT',
  attachment_path text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy "announcements_select_published"
  on public.announcements for select
  using (status = 'PUBLISHED' or public.current_role() in ('SYSTEM_ADMIN','PANITIA_SELEKSI','AUDITOR'));
create policy "announcements_manage_panitia" on public.announcements for all
  using (public.current_role() in ('PANITIA_SELEKSI','SYSTEM_ADMIN'))
  with check (public.current_role() in ('PANITIA_SELEKSI','SYSTEM_ADMIN'));

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text not null,
  type        text not null default 'info',
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.letters (
  id         text primary key,
  nama       text not null,
  kategori   text not null,
  template   text not null
);
alter table public.letters enable row level security;
create policy "letters_select" on public.letters for select using (true);
create policy "letters_manage_panitia" on public.letters for all
  using (public.current_role() in ('PANITIA_SELEKSI','SYSTEM_ADMIN'))
  with check (public.current_role() in ('PANITIA_SELEKSI','SYSTEM_ADMIN'));

-- ----------------------------------------------------------------------------
-- 9. AUDIT TRAIL — append-only, auto-populated via triggers
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  "timestamp"   timestamptz not null default now(),
  user_id       uuid references public.profiles(id),
  username      text,
  role          app_role,
  selection     text,
  module        text not null,
  action        text not null,
  old_value     text,
  new_value     text
);
alter table public.audit_logs enable row level security;

-- Read: Admin + Auditor see everything; Panitia sees rows tied to their own
-- selections; everyone else sees nothing (per "system control vs selection
-- authority" — audit visibility is itself a privileged capability).
create policy "audit_select_admin_auditor"
  on public.audit_logs for select
  using (public.current_role() in ('SYSTEM_ADMIN','AUDITOR'));

-- Write: ONLY the SECURITY DEFINER helper below may insert. No direct INSERT
-- policy is granted to any role, and — critically — there is NO update or
-- delete policy on this table at all, making it structurally append-only.
create or replace function public.write_audit_log(
  p_module text, p_action text, p_old_value text default '-', p_new_value text default '-', p_selection text default ''
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_username text;
  v_role app_role;
begin
  select username, role into v_username, v_role from public.profiles where id = auth.uid();
  insert into public.audit_logs (user_id, username, role, selection, module, action, old_value, new_value)
  values (auth.uid(), coalesce(v_username, 'system'), v_role, p_selection, p_module, p_action, p_old_value, p_new_value);
end;
$$;
revoke all on function public.write_audit_log(text,text,text,text,text) from public;
grant execute on function public.write_audit_log(text,text,text,text,text) to authenticated;

-- Example generic trigger wiring for a few high-stakes tables. Extend this
-- pattern to any table where a full change history is required.
create or replace function public.audit_trigger_generic()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_action text;
  v_old text;
  v_new text;
begin
  if tg_op = 'INSERT' then
    v_action := 'CREATE_' || upper(tg_table_name);
    v_old := '-'; v_new := 'created';
  elsif tg_op = 'UPDATE' then
    v_action := 'UPDATE_' || upper(tg_table_name);
    v_old := coalesce(old.status::text, '-');
    v_new := coalesce(new.status::text, '-');
  end if;
  perform public.write_audit_log(tg_table_name, v_action, v_old, v_new, '');
  return new;
end;
$$;

create trigger trg_audit_selections
  after insert or update on public.selections
  for each row execute function public.audit_trigger_generic();

create trigger trg_audit_decisions
  after insert on public.decisions
  for each row execute function public.audit_trigger_generic();

-- Score submission/lock is audited explicitly from the app layer (server
-- action) via write_audit_log('Assessment','SUBMIT_ASSESSMENT',...) so the
-- log can capture the candidate + component context that a generic row-level
-- trigger cannot express cleanly.

-- ----------------------------------------------------------------------------
-- 10. BOOTSTRAP: create the first SYSTEM_ADMIN profile after signup
-- ----------------------------------------------------------------------------
-- Typical flow: create the auth user via Supabase Dashboard -> Authentication
-- (or the service-role client in a setup Server Action), then run:
--
--   insert into public.profiles (id, username, name, role, unit)
--   values ('<auth-user-uuid>', 'admin', 'Nama Admin', 'SYSTEM_ADMIN', 'Bagian Perekonomian dan SDA');
--
-- See supabase/seed.sql for the full demo dataset (users, BUMD, selections...).

-- ----------------------------------------------------------------------------
-- 11. STORAGE BUCKETS (run once; safe to re-run)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kop-surat', 'kop-surat', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('candidate-documents', 'candidate-documents', false)
on conflict (id) do nothing;

-- kop-surat: publicly readable (used on the public site + letter generator),
-- writable only by admin/panitia.
create policy "kop_surat_public_read" on storage.objects for select
  using (bucket_id = 'kop-surat');
create policy "kop_surat_staff_write" on storage.objects for insert
  with check (bucket_id = 'kop-surat' and public.current_role() in ('SYSTEM_ADMIN','PANITIA_SELEKSI'));

-- candidate-documents: private. Owner (peserta) can upload; panitia/UKK/KPM/
-- admin/auditor of the relevant selection can read; only panitia verifies.
create policy "candidate_docs_owner_write" on storage.objects for insert
  with check (bucket_id = 'candidate-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "candidate_docs_owner_read" on storage.objects for select
  using (bucket_id = 'candidate-documents' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_role() in ('SYSTEM_ADMIN','AUDITOR','PANITIA_SELEKSI','TIM_UKK','KPM','PEJABAT_BERWENANG')
  ));

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
