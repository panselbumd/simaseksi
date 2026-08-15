-- Migration 0009
-- Identitas Panitia Seleksi: Nama, NIP (untuk PNS), dan Jabatan dalam Tim
-- (Ketua / Sekretaris / Anggota).
--
-- Latar belakang: seluruh naskah dinas resmi (Berita Acara, Pengumuman,
-- Surat Undangan, dst — lihat paket naskah_surat) menggunakan struktur
-- Panitia Seleksi 5 orang: Ketua, Sekretaris, dan 3 Anggota, dan blok
-- tanda tangan pada naskah tersebut selalu menampilkan Nama + NIP asli
-- masing-masing. Sebelum migrasi ini:
--   - public.profiles tidak punya kolom NIP sama sekali;
--   - public.selection_members.posisi hanya mendukung 'KETUA'/'ANGGOTA'
--     (2 posisi), dan nilainya dihitung otomatis dari "siapa yang membuat
--     seleksi" (trg_add_panitia_members, migration 0006) — bukan dari
--     jabatan definitif orang tersebut dalam Panitia;
--   - blok tanda tangan pada surat (cetak/PDF/Word) selalu berupa titik-
--     titik kosong, nama & NIP tidak pernah ditarik dari data akun.
--
-- Migrasi ini membuat Nama, NIP, dan Jabatan dalam Tim menjadi atribut
-- identitas akun Panitia Seleksi (public.profiles), bukan lagi sesuatu
-- yang ditentukan ulang setiap kali seleksi baru dibuat. Jabatan dalam
-- Tim (profiles.jabatan_tim) inilah yang menjadi sumber kebenaran untuk
-- posisi orang tsb saat didaftarkan sebagai anggota seleksi mana pun.
--
-- Safe to re-run.

-- 1) NIP — hanya wajib untuk PNS; NULL diperbolehkan (mis. profesional
--    non-PNS yang diangkat sebagai Panitia/Tim UKK).
alter table public.profiles add column if not exists nip text;

-- 2) Jabatan dalam Tim — atribut identitas Panitia Seleksi. NULL untuk
--    role selain PANITIA_SELEKSI (Tim UKK/KPM/dst tidak memakai kolom ini;
--    Tim UKK cukup dibedakan oleh keanggotaannya di selection_members).
alter table public.profiles add column if not exists jabatan_tim text
  check (jabatan_tim in ('KETUA','SEKRETARIS','ANGGOTA'));

comment on column public.profiles.nip is 'Nomor Induk Pegawai — diisi untuk anggota Panitia/Tim UKK berstatus PNS; NULL jika non-PNS.';
comment on column public.profiles.jabatan_tim is 'Jabatan dalam Tim Panitia Seleksi: KETUA / SEKRETARIS / ANGGOTA. Sumber kebenaran untuk posisi di selection_members.posisi.';

-- 3) Perluas selection_members.posisi agar sejalan dengan struktur 5-orang
--    (Ketua, Sekretaris, 3x Anggota) yang dipakai di seluruh naskah dinas.
alter table public.selection_members drop constraint if exists selection_members_posisi_check;
alter table public.selection_members add constraint selection_members_posisi_check
  check (posisi in ('KETUA','SEKRETARIS','ANGGOTA'));

-- 4) Trigger auto-enroll Panitia (migration 0006) sekarang mengambil posisi
--    dari profiles.jabatan_tim (identitas definitif orang tsb), bukan lagi
--    menebak dari created_by. Anggota yang belum diberi Jabatan dalam Tim
--    di halaman Manajemen User jatuh ke default 'ANGGOTA'.
create or replace function public.add_panitia_members_on_selection_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.selection_members (selection_id, user_id, member_role, posisi)
  select new.id, p.id, 'PANITIA_SELEKSI', coalesce(p.jabatan_tim, 'ANGGOTA')
  from public.profiles p
  where p.role = 'PANITIA_SELEKSI' and p.active = true
  on conflict (selection_id, user_id, member_role) do nothing;
  return new;
end;
$$;

-- 5) Sinkronkan selection_members.posisi yang sudah ada dengan
--    profiles.jabatan_tim, untuk siapa pun yang sudah diberi Jabatan
--    dalam Tim lewat Manajemen User setelah migrasi ini dijalankan.
update public.selection_members sm
set posisi = p.jabatan_tim
from public.profiles p
where sm.user_id = p.id
  and sm.member_role = 'PANITIA_SELEKSI'
  and p.jabatan_tim is not null
  and sm.posisi is distinct from p.jabatan_tim;

NOTIFY pgrst, 'reload schema';
