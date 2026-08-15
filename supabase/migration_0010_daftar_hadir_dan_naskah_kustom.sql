-- Migration 0010
-- 1) Daftar Hadir (Lampiran L-01 pada paket naskah dinas) sebagai halaman
--    cetak terpisah — dipakai berulang di hampir semua Berita Acara.
-- 2) Naskah Dinas Kustom: Panitia bisa membuat naskah dari kosong (judul,
--    "tentang", bentuk tanda tangan sendiri) dan mengedit langsung redaksi
--    (isi) naskah dinas mana pun di aplikasi, bukan lagi selalu dihitung
--    ulang otomatis dari template.
--
-- Safe to re-run.

-- ── 1) Daftar Hadir ──────────────────────────────────────────────────────
create table if not exists public.attendance_sheets (
  id              uuid primary key default gen_random_uuid(),
  selection_id    uuid not null references public.selections(id) on delete cascade,
  judul_kegiatan  text not null,          -- e.g. "Pelaksanaan Uji Kelayakan dan Kepatutan (UKK)"
  tanggal         date not null default current_date,
  tempat          text,
  baris_kosong    integer not null default 10 check (baris_kosong between 0 and 40),
  letter_id       uuid references public.letters(id) on delete set null, -- opsional: dikaitkan ke satu Berita Acara
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

alter table public.attendance_sheets enable row level security;

drop policy if exists "attendance_select_all" on public.attendance_sheets;
create policy "attendance_select_all" on public.attendance_sheets for select using (true);

drop policy if exists "attendance_manage_panitia" on public.attendance_sheets;
create policy "attendance_manage_panitia" on public.attendance_sheets for all
  using (public.current_role() = 'PANITIA_SELEKSI')
  with check (public.current_role() = 'PANITIA_SELEKSI');

drop trigger if exists trg_audit_attendance_sheets on public.attendance_sheets;
create trigger trg_audit_attendance_sheets
  after insert on public.attendance_sheets
  for each row execute function public.audit_trigger_generic();

-- ── 2) Naskah Dinas Kustom ───────────────────────────────────────────────
-- Saat jenis_surat = 'custom', keempat kolom di bawah menggantikan definisi
-- template statis di lib/letter-templates.ts (lihat resolveTemplate() di
-- lib/letter-templates.ts) — Panitia menentukan sendiri judul, "tentang",
-- bentuk naskah, dan bentuk tanda tangan.
alter table public.letters add column if not exists custom_judul text;
alter table public.letters add column if not exists custom_tentang text;
alter table public.letters add column if not exists custom_layout text
  check (custom_layout in ('korespondensi','judul'));
alter table public.letters add column if not exists custom_signature text
  check (custom_signature in ('single','table5','block3','peserta'));

comment on column public.letters.isi is 'Redaksi/isi naskah — bisa diedit bebas langsung oleh Panitia di layar Ubah Surat, tidak lagi selalu dihitung ulang otomatis dari template.';

NOTIFY pgrst, 'reload schema';
