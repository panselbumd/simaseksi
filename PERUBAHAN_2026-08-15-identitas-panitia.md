# Perubahan — 15 Agustus 2026: Identitas Panitia & Naskah Dinas

Menjawab kebutuhan yang disampaikan: identitas Panitia Seleksi (Nama, NIP,
Jabatan dalam Tim) ditarik otomatis ke naskah dinas, dan paket naskah dinas
resmi (Berita Acara/Pengumuman/Surat Internal Panitia/Surat Kepada Peserta)
tersedia langsung di Generator Surat.

## 1. Identitas Panitia Seleksi: Nama, NIP, Jabatan dalam Tim

**Sebelumnya:** `profiles` tidak punya kolom NIP sama sekali, dan
`selection_members.posisi` hanya mendukung 2 nilai (`KETUA`/`ANGGOTA`) yang
dihitung otomatis dari "siapa yang membuat seleksi" — bukan dari jabatan
definitif orang tsb. Blok tanda tangan pada surat selalu berupa titik-titik
kosong.

**Sekarang:**
- `supabase/migration_0009_identitas_panitia.sql` (baru) — jalankan di
  Supabase SQL Editor:
  - `profiles.nip` (nullable — untuk PNS saja).
  - `profiles.jabatan_tim` (`KETUA`/`SEKRETARIS`/`ANGGOTA`) — atribut
    identitas akun Panitia Seleksi.
  - `selection_members.posisi` diperluas jadi 3 nilai (menambahkan
    `SEKRETARIS`) agar sejalan dengan struktur 5-orang (Ketua, Sekretaris,
    3 Anggota) yang dipakai di seluruh naskah dinas resmi.
  - Trigger auto-enroll Panitia (migration 0006) diperbarui: posisi
    sekarang diambil dari `profiles.jabatan_tim`, bukan lagi ditebak dari
    `created_by`.
- **Manajemen User** (`/users`): form tambah/ubah user sekarang punya
  field **NIP** dan **Jabatan dalam Tim**. Jabatan dalam Tim wajib diisi
  untuk akun Panitia Seleksi. Mengubahnya juga otomatis memperbarui posisi
  orang tsb di semua seleksi yang sedang ia ikuti. Target jumlah akun
  Panitia Seleksi di kartu ringkasan disesuaikan dari 2 menjadi **5**
  (Ketua, Sekretaris, 3 Anggota) — sesuai struktur nyata di naskah dinas.
- **`lib/letter-signature.ts`** (baru) — satu-satunya sumber kebenaran
  untuk menarik Nama+NIP Ketua/Sekretaris/Anggota/Tim UKK dari
  `selection_members` × `profiles` pada suatu seleksi. Dipakai bersama
  oleh halaman Cetak, unduh PDF, dan unduh Word, supaya ketiganya tidak
  pernah berbeda.

## 2. Paket naskah dinas resmi (23 template baru menggantikan 8 template lama)

`lib/letter-templates.ts` ditulis ulang, memuat redaksi lengkap dari paket
naskah dinas yang dilampirkan (Permendagri No. 1 Tahun 2023), dikelompokkan
seperti struktur foldernya:

- **Berita Acara** (13) — Rapat Persiapan & Penetapan Rencana Kerja,
  Penerimaan & Penutupan Pendaftaran, Verifikasi & Pemeriksaan Dokumen
  Administrasi, Penetapan Hasil Seleksi Administrasi, Pelaksanaan UKK,
  Rekapitulasi Hasil UKK, Pelaksanaan Presentasi & Wawancara, Rekapitulasi
  Hasil Presentasi & Wawancara, Pelaksanaan Wawancara KPM, Serah Terima
  Laporan Hasil, Rekapitulasi Nilai Seluruh Tahapan, Penyelesaian Tugas &
  Penutupan Panitia, Penetapan Peringkat & Rekomendasi Hasil Akhir.
- **Pengumuman** (3) — Pengumuman Seleksi, Pengumuman Hasil Seleksi
  Administrasi, Pengumuman Hasil Akhir.
- **Surat Internal Panitia** (2) — Undangan Rapat Anggota Panitia, Undangan
  Rapat Koordinasi Panitia & Tim UKK.
- **Surat Kepada Peserta** (5) — Undangan Verifikasi, Undangan UKK,
  Undangan Presentasi & Wawancara, Undangan Wawancara KPM, Pemberitahuan
  Hasil Akhir.
- **Lainnya** (5) — Surat Tugas, Pakta Integritas, Rekomendasi, Keputusan,
  Penetapan — dipertahankan dari versi sebelumnya (tidak berasal dari
  paket naskah_surat, tapi tetap relevan).

Dropdown "Jenis Surat" di Generator Surat & Edit Surat sekarang berupa
`<optgroup>` per kategori mengikuti pengelompokan di atas.

Bagian isi yang datanya tidak tersedia di sistem (mis. `[tempat]`,
`[jam]`, daftar tabel peserta pada Pengumuman) sengaja dibiarkan sebagai
placeholder berkurung — persis seperti naskah aslinya — untuk dilengkapi
Panitia langsung di layar Ubah Surat sebelum difinalisasi.

## 3. Tanda tangan otomatis: 3 bentuk blok, sesuai naskah aslinya

**Sebelumnya:** satu bentuk blok tanda tangan saja (Ketua Panitia,
titik-titik kosong, tanpa NIP) untuk semua jenis surat.

**Sekarang**, tiap template punya tipe tanda tangan (`signature.kind`) yang
menentukan blok mana yang dirender, dengan Nama+NIP asli ditarik lewat
`lib/letter-signature.ts`:

- **`single`** — hanya Ketua Panitia Seleksi (Nama+NIP), untuk Pengumuman,
  Surat Internal Panitia, Surat Kepada Peserta, dan naskah "Lainnya".
- **`table5`** — tabel No/Nama/Jabatan/Tanda Tangan berisi 5 baris (Ketua,
  Sekretaris, 3 Anggota) menandatangani individual — untuk 7 Berita Acara
  tahapan teknis (verifikasi, UKK, presentasi, dst).
- **`block3`** — blok 3 kolom Ketua / Sekretaris / Anggota (Nama+NIP
  masing-masing) — untuk 6 Berita Acara rekapitulasi/penutupan/penetapan
  lintas-tahapan.
- **`peserta`** — yang menandatangani adalah Peserta/Calon (Pakta
  Integritas) — tidak berubah dari sebelumnya.

Ketiga output (halaman Cetak, unduh Word, unduh PDF) diperbarui agar
konsisten merender ketiga bentuk baru ini, bukan hanya blok tunggal.

## Yang perlu dilakukan sebelum deploy

1. **Jalankan migrasi baru** di Supabase SQL Editor:
   `supabase/migration_0009_identitas_panitia.sql` (aman dijalankan
   berkali-kali).
2. **Lengkapi NIP & Jabatan dalam Tim** untuk kelima akun Panitia Seleksi
   lewat `/users` → Edit — tanpa ini, blok tanda tangan akan menampilkan
   titik-titik placeholder, bukan nama sungguhan (bukan error, hanya belum
   terisi).
3. Seperti biasa: **ganti seluruh folder proyek** di GitHub, jangan hanya
   menimpa sebagian file dari zip (lihat catatan deployment di sesi-sesi
   sebelumnya).
4. Opsional: jalankan `npm run db:types` untuk memperbarui
   `lib/supabase/database.types.ts` dengan kolom `nip`/`jabatan_tim` yang
   baru (proyek ini tidak memakainya secara strict-typed, jadi build tetap
   berhasil tanpa langkah ini — hanya untuk kelengkapan autocomplete).

## Tidak termasuk dalam perubahan ini

Dua dokumen dalam paket naskah_surat — **Paket Form Penilaian UKK** dan
**Lampiran Paket Format Berita Acara** (daftar hadir, checklist, dsb) —
adalah instrumen/lampiran pendukung, bukan naskah dinas bernomor-surat
dengan tanda tangan Panitia, sehingga tidak dimasukkan ke Generator Surat.
Penilaian UKK sendiri sudah difasilitasi secara digital di modul
Assessment; jika lampiran-lampiran itu juga ingin dibuatkan halaman
cetak tersendiri, sampaikan saja dan akan disusulkan.
