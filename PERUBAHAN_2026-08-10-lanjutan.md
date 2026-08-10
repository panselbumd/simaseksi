# Perubahan (lanjutan) — 10 Agustus 2026

## 1. Cetak surat sekarang benar-benar cetak dokumen saja

**Akar masalah:** halaman `/letters/[id]/cetak` dan `/reports/[key]/cetak`
sebelumnya berada di dalam grup route `(app)` yang otomatis dibungkus
sidebar + header aplikasi (`app/(app)/layout.tsx`). Saat tombol Cetak
diklik dan browser mencetak, yang tercetak bukan cuma surat — melainkan
seluruh tampilan aplikasi (sidebar, header, tombol navigasi) ikut ke
kertas/PDF.

**Perbaikan:** kedua halaman dipindah ke grup route baru `(print)` yang
tidak memiliki chrome aplikasi sama sekali (URL-nya tetap sama persis,
`/letters/[id]/cetak` dan `/reports/[key]/cetak` — grup route dengan tanda
kurung tidak memengaruhi URL). Sekarang saat dicetak, halaman **hanya**
berisi dokumen surat/laporan sesuai tata naskah dinas, tanpa elemen
aplikasi lain. `PrintButton` dipindah ke `components/PrintButton.tsx`
(dipakai bersama oleh kedua halaman).

## 2. Generator Surat: fitur Lihat / Edit / Simpan / Unduh / Cetak lengkap

- **Lihat & Cetak** — tombol "Lihat / Cetak" pada setiap draf membuka
  dokumen utuh di tab baru (route yang sama seperti di atas, sudah bebas
  dari chrome aplikasi).
- **Unduh** — tombol "Unduh Word" dan "Unduh PDF" (sebelumnya berlabel
  "Word"/"PDF" saja, sekarang lebih jelas).
- **Edit** — halaman baru `letters/[id]/edit` dengan form + pratinjau
  langsung (sama seperti form pembuatan), memakai server action baru
  `updateLetterAction`. Hanya bisa dipakai selama draf masih berstatus
  DRAFT (surat FINAL dikunci, sesuai desain audit trail yang sudah ada).
  Tombol "Edit" muncul di tabel Draf Tersimpan untuk setiap draf.
- **Simpan** — `createLetterAction`, `updateLetterAction`,
  `finalizeLetterAction`, dan `deleteLetterAction` sekarang semuanya
  memeriksa jumlah baris yang benar-benar berubah dan melempar pesan
  error yang jelas jika 0 baris berubah (pola yang sama seperti perbaikan
  tombol Hapus Manajemen Seleksi sebelumnya) — jadi kalau simpan gagal
  karena RLS/izin, sekarang akan terlihat pesannya, bukan gagal diam-diam.

## 3. Gambar gedung BUMD dipasang di Beranda

Gambar yang dilampirkan (render Perumdam Among Tirto & PT. Batu Wisata
Resource) disimpan sebagai `public/images/beranda-hero.jpg` dan dipasang
sebagai latar belakang bagian Beranda (`components/HeroBackground.tsx`,
menggantikan ilustrasi SVG abstrak sebelumnya), dengan pengaturan
transparansi profesional:

- Foto diberi opacity ~42% supaya jadi latar, bukan elemen yang bersaing
  dengan judul/teks di depannya.
- **CSS mask-image** gradient di keempat sisi supaya foto memudar halus
  ke warna navy latar — tidak ada garis tepi kotak yang kentara.
- **Scrim gradient navy** di atas foto (lebih gelap di bagian bawah, tempat
  paragraf teks berada) supaya kontras teks putih/emas tetap terjaga.
- `next/image` dengan `priority` + `placeholder="blur"` untuk pemuatan
  cepat di atas layar pertama (LCP).

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses (semua
23 route, termasuk `/letters/[id]/edit` dan kedua route `(print)`,
ter-generate tanpa error).
