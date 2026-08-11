-- Jalankan di Supabase SQL Editor untuk memastikan penyebab paling mungkin
-- dari "Simpan Draf tidak berfungsi" di Generator Surat sudah teratasi.

-- 1) Apakah trigger dari migration_0006 sudah terpasang?
--    Harus mengembalikan 1 baris bernama trg_add_panitia_members.
select tgname from pg_trigger where tgname = 'trg_add_panitia_members';

-- 2) Apakah SEMUA akun Panitia Seleksi yang aktif berikut ini sudah
--    tercatat sebagai anggota di SETIAP seleksi yang ada?
--    Kolom "belum_jadi_anggota" pada baris manapun harus 0.
select
  s.id as selection_id,
  s.nama as nama_seleksi,
  (select count(*) from public.profiles p where p.role = 'PANITIA_SELEKSI' and p.active = true) as total_panitia_aktif,
  count(sm.id) as sudah_jadi_anggota,
  (select count(*) from public.profiles p where p.role = 'PANITIA_SELEKSI' and p.active = true) - count(sm.id) as belum_jadi_anggota
from public.selections s
left join public.selection_members sm
  on sm.selection_id = s.id and sm.member_role = 'PANITIA_SELEKSI'
group by s.id, s.nama
order by belum_jadi_anggota desc;

-- Kalau baris #1 kosong (trigger belum ada) ATAU ada baris dengan
-- belum_jadi_anggota > 0 di query #2 — jalankan ulang:
--   supabase/migration_0006_fix_pansel_membership.sql
-- Migrasi ini aman dijalankan berkali-kali.

-- 3) (Opsional) Cek juga apakah ketiga akun panitia ini semuanya aktif —
--    kalau active = false, trigger TIDAK akan menambahkan mereka sebagai
--    anggota seleksi manapun (lihat WHERE clause di migration_0006).
select username, role, active
from public.profiles
where role = 'PANITIA_SELEKSI';
