-- ============================================================================
-- SIMASEKSI — Pra-Go-Live: hapus data lamaran CONTOH (bukan orang sungguhan)
-- Dibuat oleh scripts/seed-auth-users.ts: peserta01 / "Ahmad Prasetyo Wibowo"
-- pada seleksi 33333333-3333-3333-3333-333333333333, lengkap dengan nilai
-- UKK contoh yang sudah terkunci. Jalankan SEBELUM menghapus akun peserta01
-- lewat /users, karena applicants.user_id & candidates.user_id TIDAK punya
-- on delete cascade — menghapus akunnya duluan akan gagal (foreign key).
--
-- Aman dijalankan berkali-kali (semua klausa pakai WHERE spesifik).
-- Jalankan di: Supabase Dashboard → SQL Editor.
-- ============================================================================

-- 1) Nilai UKK contoh (terkunci) untuk kandidat demo
delete from public.assessment_scores
where candidate_id in (
  select id from public.candidates
  where selection_id = '33333333-3333-3333-3333-333333333333'
    and nama = 'Ahmad Prasetyo Wibowo'
);

-- 2) Status penilaian per anggota Tim UKK untuk kandidat demo
delete from public.assessments
where candidate_id in (
  select id from public.candidates
  where selection_id = '33333333-3333-3333-3333-333333333333'
    and nama = 'Ahmad Prasetyo Wibowo'
);

-- 3) Baris kandidat demo (ini yang muncul di Ranking)
delete from public.candidates
where selection_id = '33333333-3333-3333-3333-333333333333'
  and nama = 'Ahmad Prasetyo Wibowo';

-- 4) Baris pelamar demo
delete from public.applicants
where selection_id = '33333333-3333-3333-3333-333333333333'
  and nama = 'Ahmad Prasetyo Wibowo';

-- Setelah ini berhasil (0 error), baru aman menghapus akun peserta01
-- lewat /users di aplikasi jika memang tidak akan dipakai.

-- Cek hasil akhir — harus kosong:
-- select * from public.candidates where nama = 'Ahmad Prasetyo Wibowo';
