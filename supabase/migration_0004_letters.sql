-- ============================================================================
-- Migration 0004 — Generator Surat (Dokumen & Laporan > Generator Surat)
--
-- Adds the `letters` table: saved/generated official-letter drafts. Reuses
-- the existing `kop-surat` Storage bucket and `bumds.kop_image_path` (both
-- already provisioned in schema.sql) for the letterhead image.
--
-- Idempotent: safe to re-run (create table/policy use if-not-exists guards
-- where Postgres supports them; policies are dropped and recreated).
-- ============================================================================

create table if not exists public.letters (
  id            uuid primary key default gen_random_uuid(),
  selection_id  uuid not null references public.selections(id) on delete cascade,
  jenis_surat   text not null,          -- id from lib/letter-templates.ts, e.g. 'lt-keputusan'
  nama_surat    text not null,          -- display name at time of creation, e.g. 'Keputusan'
  nomor         text not null,
  tanggal       date not null default current_date,
  nama_peserta  text,
  jabatan       text,
  periode       text,
  dasar_hukum   text,
  isi           text not null,          -- filled-in body text (after {{...}} substitution)
  status        text not null default 'DRAFT' check (status in ('DRAFT','FINAL')),
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

alter table public.letters enable row level security;

-- Read: same visibility class as recommendations/decisions/announcements —
-- any authenticated staff account (drafts are not sensitive beyond what's
-- already shown elsewhere in the selection).
drop policy if exists "letters_select_all" on public.letters;
create policy "letters_select_all" on public.letters for select using (true);

-- Write: only Panitia Seleksi, matching PERMISSIONS.letter.manage in lib/rbac.ts.
-- Admin can view (System Control) but never drafts/edits official correspondence,
-- same separation already enforced on recommendations/decisions.
drop policy if exists "letters_manage_panitia" on public.letters;
create policy "letters_manage_panitia" on public.letters for all
  using (public.current_role() = 'PANITIA_SELEKSI')
  with check (public.current_role() = 'PANITIA_SELEKSI');

drop trigger if exists trg_audit_letters on public.letters;
create trigger trg_audit_letters
  after insert on public.letters
  for each row execute function public.audit_trigger_generic();
