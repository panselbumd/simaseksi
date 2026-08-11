# Perubahan (lanjutan #3) — 11 Agustus 2026

## 1. "Cetak/Unduh Surat" di Manajemen Seleksi — sudah tidak pindah ke Generator Surat

Tombol itu sebelumnya `href="/letters?selection=..."` — mengarah ke menu
Generator Surat yang terpisah, kehilangan konteks "sedang di Manajemen
Seleksi". Sekarang ada halaman baru **di dalam modul Selections sendiri**:

`app/(app)/selections/[id]/surat/page.tsx` — dibuka dari
`/selections/[id]/surat`, isinya daftar semua surat milik seleksi
tersebut saja (Lihat/Cetak, Unduh Word, Unduh PDF, dan untuk Panitia:
Edit/Finalisasi/Hapus untuk yang masih Draf) — semua tanpa keluar dari
konteks Manajemen Seleksi.

Menyusun draf surat **baru** (perlu pilih jenis surat & template) tetap
lewat Generator Surat — jadi di halaman ini juga ada tombol pintasan
"+ Susun Surat Baru di Generator Surat" yang sekarang **benar-benar
membawa seleksi terpilih otomatis** ke form Generator Surat (sebelumnya
parameter `?selection=` di URL itu sama sekali tidak dibaca oleh
formnya).

## 2. Generator Surat — "Simpan Draf tidak berfungsi": kemungkinan besar akar masalah sebenarnya ditemukan

Karena laporannya konsisten di **ketiga** akun Panitia Seleksi
(`anggota_pansel`, `ketua_pansel`, `anggota2_pansel`) sekaligus — bukan
cuma satu akun — ini titik terang penting. Setelah ditelusuri ulang,
skenario yang paling cocok dengan gejala ini:

**RLS pada tabel `selections` mensyaratkan jadi *anggota* seleksi
(`selection_members`) untuk bisa melihatnya selama statusnya masih
`DRAFT`.** Migration `migration_0006_fix_pansel_membership.sql` (yang
saya kirim dua sesi lalu) menambahkan trigger + backfill supaya SEMUA
akun Panitia Seleksi otomatis jadi anggota tiap seleksi. **Kalau migrasi
SQL itu belum benar-benar dijalankan di Supabase Anda**, ketiga akun
Panitia sekaligus tidak akan pernah terdaftar sebagai anggota seleksi
manapun yang masih berstatus Draf — akibatnya:

- Dropdown "Seleksi" di form Generator Surat bisa kosong / formulirnya
  sama sekali tidak muncul (karena kode sebelumnya cuma menyembunyikan
  form kalau `selections.length === 0`, **tanpa pesan apa pun** — jadi
  terlihat seperti fitur itu tidak ada / tidak berfungsi, padahal
  sebenarnya cuma tidak dirender).
- Kalaupun form muncul (untuk seleksi yang sudah tidak berstatus Draf),
  submit "Simpan sebagai Draf" akan gagal dengan pesan "Seleksi tidak
  ditemukan" — karena action di server melakukan pengecekan ulang yang
  kena RLS yang sama.

**Cara memastikan (silakan jalankan) — file baru:**
`supabase/diagnostic_check_pansel_membership.sql` — jalankan 3 query di
dalamnya di Supabase SQL Editor. Query #1 & #2 langsung menunjukkan
apakah migration_0006 sudah aktif dan lengkap. Kalau hasilnya menunjukkan
belum, jalankan ulang `migration_0006_fix_pansel_membership.sql` (aman
dijalankan berkali-kali) — ini kemungkinan besar akan menuntaskan
masalah "Simpan Draf tidak berfungsi" sepenuhnya.

**Perbaikan kode yang sudah saya terapkan supaya masalah ini tidak lagi
tersembunyi tanpa penjelasan, apa pun hasil diagnosisnya:**
- Kalau akun Panitia belum punya seleksi yang bisa dikelola, sekarang
  muncul **kotak penjelasan kuning** yang eksplisit menyebut kemungkinan
  penyebabnya (bukan form yang diam-diam hilang tanpa keterangan).
- Pesan error saat submit gagal karena seleksi tidak ditemukan sekarang
  ikut menyebutkan kemungkinan penyebabnya (migrasi belum jalan), bukan
  sekadar "Seleksi tidak ditemukan" yang tidak actionable.

### Fitur Tambah/Edit/Unduh/Cetak/Hapus — sudah lengkap sejak sesi sebelumnya
Semua tetap tersedia begitu form Generator Surat berhasil tampil (per
baris draf di tabel "Draf Tersimpan", dan sekarang juga di halaman
Manajemen Seleksi → Cetak/Unduh Surat): Tambah, Simpan, Lihat/Cetak,
Edit, Unduh Word, Unduh PDF, Finalisasi, Hapus.

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses — 30
route ter-generate tanpa error, termasuk `/selections/[id]/surat` yang
baru.
