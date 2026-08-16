# Perubahan — 15 Agustus 2026 (lanjutan 2): Perbaikan Kop/Mode Gelap, Nomor Registrasi & Kode Peserta

## 1. Perbaikan: garis ganda di bawah kop surat

**Penyebab:** gambar kop surat (`public/kop-surat/*.jpg`) sudah punya garis
tebal bawaan di bagian bawahnya (sesuai desain aslinya), tapi kode
sebelumnya *menambahkan* garis lagi lewat CSS/border — sehingga tampak dua
garis berdekatan yang terlihat seperti baris tabel.

**Perbaikan:** garis tambahan dihapus di kelima tempat yang merendernya —
halaman Cetak Surat, unduh PDF, unduh Word, pratinjau Generator Surat,
pratinjau Ubah Surat, dan halaman cetak Daftar Hadir. Garis bawah kop yang
tersisa sekarang murni dari gambar aslinya.

## 2. Perbaikan kontras warna teks — Mode Gelap & Mode Terang

**Penyebab:** Mode Gelap diimplementasikan dengan menimpa kelas warna
Tailwind yang sering dipakai (bukan menambahkan varian `dark:` di ~40
halaman) lewat `app/globals.css`. Cakupan sebelumnya tidak lengkap —
banyak kelas teks gelap (`text-navy-900/800/700/950`, `text-gray-700/600/
500/400`, `text-red-700/600`, `text-green-800/700/600`, `text-blue-700`)
dan beberapa border/hover terang tidak ikut ditimpa, sehingga di Mode
Gelap teks tersebut hampir tidak terbaca di atas latar gelap.

**Perbaikan:** `app/globals.css` diperluas untuk menimpa seluruh kelas
warna teks/border/hover di atas dengan versi terang yang setara,
mengikuti pola pemetaan yang sudah ada (mis. `text-ink-*`). Sudah diaudit
ulang untuk Mode Terang — tidak ditemukan kombinasi teks/latar terpisah
yang bermasalah di sana (elemen berlatar navy gelap seperti header/hero
publik memang disengaja sama di kedua mode).

## 3. Nomor Registrasi & Kode Peserta (format by sistem)

Sesuai kebutuhan: peserta yang mendaftar lewat aplikasi otomatis
mendapatkan **Nomor Registrasi** begitu form pendaftaran tersimpan, dan
**Kode Peserta** begitu berkas persyaratannya dinyatakan memenuhi
ketentuan.

- **Migrasi baru:** `supabase/migration_0011_nomor_registrasi_kode_peserta.sql`
  menambah kolom `nomor_registrasi` dan `kode_peserta` ke `applicants`,
  plus trigger yang mengisi `nomor_registrasi` otomatis saat pendaftaran
  disimpan.
  - **Nomor Registrasi:** `REG-{tahun}-{urut 4 digit}`, mis. `REG-2026-0007`
    — diberikan ke **setiap** pendaftar, apa pun hasil verifikasi
    berkasnya nanti.
  - **Kode Peserta:** `{inisial jabatan}-{inisial BUMD}-{tahun}-{urut 3
    digit}`, mis. `DU-PAT-2026-001` untuk pelamar Direktur Utama Perumdam
    Among Tirto ke-1 tahun 2026 (`lib/kode-peserta.ts`) — **hanya**
    diterbitkan begitu seluruh dokumen wajib peserta berstatus **Disetujui**.
- **Otomatis, tanpa langkah manual tambahan:** begitu dokumen wajib
  terakhir seorang peserta disetujui Panitia (`app/(app)/documents/actions.ts`),
  sistem langsung: menerbitkan Kode Peserta, menandai peserta sebagai
  Kandidat, memindahkannya ke modul Kandidat (siap masuk tahap
  UKK/Wawancara), dan mengirim email notifikasi berisi Kode Peserta.
- **Ditampilkan di:**
  - Halaman "Pendaftaran Berhasil" — Nomor Registrasi langsung tampil
    setelah submit.
  - Halaman Dokumen Persyaratan (tampilan Peserta) — kartu Nomor
    Registrasi & Kode Peserta di bagian atas.
  - Halaman Verifikasi Dokumen (tampilan Panitia) — **Rekap Kelengkapan
    Peserta** baru: tabel ringkas per peserta (bukan per dokumen) yang
    otomatis menghitung X/8 dokumen disetujui, No. Registrasi, Kode
    Peserta, dan status — inilah bagian "merekap by sistem" yang diminta.
  - Halaman Kandidat — kolom Kode Peserta.

## Yang perlu dilakukan sebelum deploy

1. Jalankan `supabase/migration_0011_nomor_registrasi_kode_peserta.sql`
   di Supabase SQL Editor (aman berkali-kali; bisa dijalankan bersama
   migration_0009 dan migration_0010 sebelumnya).
2. Ganti seluruh folder proyek di GitHub seperti biasa.
3. Coba Mode Gelap di beberapa halaman (Dashboard, Manajemen User,
   Dokumen, Generator Surat) untuk memastikan kontras sudah sesuai
   sebelum go-live; beri tahu jika masih ada bagian yang kurang terbaca.
