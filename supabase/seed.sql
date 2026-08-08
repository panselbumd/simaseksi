-- ============================================================================
-- SIMASEKSI — Demo Seed Data
-- Run AFTER schema.sql. Auth users must be created first (see README §3.2),
-- then replace the placeholder UUIDs below with the real auth.users.id values
-- before running, OR run scripts/seed-auth-users.ts which does both steps.
-- ============================================================================

-- --- BUMD ------------------------------------------------------------------
insert into public.bumds (id, nama, bentuk_badan_hukum, tahun_berdiri, bidang_usaha, alamat, website, status, deskripsi, kop_image_path) values
('11111111-1111-1111-1111-111111111111', 'PERUMDAM Among Tirto Kota Batu', 'Perusahaan Umum Daerah (Perumda)', 1990, 'Penyediaan Air Minum / Air Bersih', 'Jl. Panglima Sudirman No. 507, Kota Batu', 'www.perumdamamongtirto.co.id', 'AKTIF', 'Perusahaan Umum Daerah Air Minum yang menyelenggarakan pelayanan air minum bagi masyarakat Kota Batu.', 'KOP_PANSEL_PERUMDAM.png'),
('22222222-2222-2222-2222-222222222222', 'PT. Batu Wisata Resource', 'Perseroan Terbatas (BUMD)', 2015, 'Pariwisata dan Pengembangan Sumber Daya Daerah', 'Jl. Panglima Sudirman No. 507, Kota Batu', 'www.batuwisataresource.co.id', 'AKTIF', 'Badan usaha milik daerah yang bergerak di bidang pariwisata dan pengembangan bisnis strategis daerah.', 'KOP_PANSEL_PT_BWR.png');

-- --- REGULATIONS -------------------------------------------------------------
insert into public.regulations (kategori, judul, nomor, tahun, status, tag, catatan) values
('UU', 'UU Nomor 23 Tahun 2014 tentang Pemerintahan Daerah', '23/2014', 2014, 'REFERENCE', array['BUMD','Otonomi Daerah'], 'NEEDS REGULATORY VALIDATION'),
('PP', 'PP Nomor 54 Tahun 2017 tentang Badan Usaha Milik Daerah', '54/2017', 2017, 'REFERENCE', array['BUMD','Tata Kelola'], 'NEEDS REGULATORY VALIDATION'),
('Permendagri', 'Permendagri Nomor 37 Tahun 2018 tentang Pengangkatan dan Pemberhentian Anggota Direksi dan Anggota Dewan Pengawas BUMD', '37/2018', 2018, 'REFERENCE', array['Direksi','Dewan Pengawas'], 'NEEDS REGULATORY VALIDATION'),
('Permendagri', 'Permendagri Nomor 23 Tahun 2024', '23/2024', 2024, 'NEEDS_VALIDATION', array['BUMD'], 'NEEDS REGULATORY VALIDATION');

-- --- SOP ---------------------------------------------------------------------
insert into public.sops (kode, nama, unit_kerja, dasar_hukum, pic, durasi, status, version) values
('SOP/PANSEL/01', 'Verifikasi Administrasi Pendaftaran Calon Direksi', 'Panitia Seleksi', 'Permendagri 37/2018', 'Panitia Seleksi', '5 hari kerja', 'AKTIF', '1.0'),
('SOP/PANSEL/02', 'Pelaksanaan Uji Kompetensi dan Kelayakan (UKK)', 'Tim UKK', 'Juknis UKK 2026', 'Tim UKK', '3 hari kerja', 'AKTIF', '1.0');

-- --- SELECTIONS ----------------------------------------------------------------
insert into public.selections (id, nama, bumd_id, jabatan, tahun, formasi, selection_type, candidate_source, dasar_hukum, start_date, end_date, status) values
('33333333-3333-3333-3333-333333333333', 'Seleksi Calon Direksi Perumdam Among Tirto', '11111111-1111-1111-1111-111111111111', 'Direksi', 2026, 2, 'OPEN_SELECTION', 'PUBLIC_REGISTRATION', 'Permendagri 37/2018; Perwali Kota Batu (draft)', '2026-06-01', '2026-08-30', 'UKK'),
('44444444-4444-4444-4444-444444444444', 'Seleksi Calon Dewan Pengawas Perumdam Among Tirto', '11111111-1111-1111-1111-111111111111', 'Dewan Pengawas', 2026, 2, 'INTERNAL_SELECTION', 'INTERNAL_PEMDA', 'Permendagri 37/2018', '2026-07-01', '2026-09-15', 'VERIFICATION');

-- --- ASSESSMENT COMPONENTS (Seleksi Direksi) ---------------------------------
insert into public.assessment_components (selection_id, name, weight) values
('33333333-3333-3333-3333-333333333333', 'Pengalaman', 20),
('33333333-3333-3333-3333-333333333333', 'Keahlian', 20),
('33333333-3333-3333-3333-333333333333', 'Integritas & Etika', 15),
('33333333-3333-3333-3333-333333333333', 'Kepemimpinan', 15),
('33333333-3333-3333-3333-333333333333', 'Pemahaman Pemerintahan & Tata Kelola BUMD', 20),
('33333333-3333-3333-3333-333333333333', 'Kemauan & Dedikasi', 10);

-- NOTE: profiles, applicants, candidates, and assessment_scores reference
-- auth.users.id and are therefore seeded by scripts/seed-auth-users.ts
-- (it creates the auth users first, then inserts these dependent rows with
-- the real generated UUIDs). Running raw SQL for those tables would require
-- manually creating matching auth.users rows first.
