# Template naskah dinas diperbarui berdasarkan referensi resmi — 12 Agustus 2026

## Sumber referensi yang digunakan

1. **Permendagri Nomor 1 Tahun 2023 tentang Tata Naskah Dinas di
   Lingkungan Pemerintah Daerah** — regulasi yang mengatur bentuk resmi
   tiap jenis naskah dinas (Pengumuman, Berita Acara, Surat Tugas,
   Surat Undangan, Rekomendasi, dst).
2. **Dokumen Pansel BUMD sungguhan dari daerah lain** yang menjalankan
   proses serupa (seleksi Direksi/Dewan Pengawas/Komisaris BUMD):
   Panitia Seleksi Anggota Komisaris dan Direksi PT. Pembangunan
   Prasarana Sumatera Utara (Perseroda) — Pemprov Sumatera Utara, dan
   Panitia Seleksi Direksi BUMD PT. Subang Sejahtera — Kabupaten
   Subang.

## Temuan penting: dua bentuk naskah dinas yang berbeda

Ternyata bukan semua jenis surat punya bentuk yang sama. Berdasarkan
regulasi dan contoh nyata di atas, ada dua bentuk:

- **Bentuk korespondensi** (surat biasa) — tanggal rata kanan di atas,
  lalu baris "Nomor:" dan "Perihal:", ditujukan dan ditandatangani oleh
  Panitia. Ini yang selama ini dipakai untuk SEMUA jenis surat — padahal
  sebenarnya hanya cocok untuk **Undangan** dan **Rekomendasi** (surat
  yang memang dikirim KEPADA seseorang).
- **Bentuk judul** (blok judul di tengah) — nama jenis naskah dicetak
  tebal & digarisbawahi di tengah halaman ("PENGUMUMAN" / "BERITA
  ACARA" / "SURAT TUGAS" / "KEPUTUSAN ..."), diikuti "NOMOR: ..." dan
  "TENTANG ...", TANPA baris Nomor:/Perihal: dan tanpa alamat tujuan.
  Ini bentuk yang benar untuk **Pengumuman, Surat Tugas, Berita Acara,
  Keputusan, Penetapan, dan Pakta Integritas** — sebelumnya semua jenis
  ini salah dipaksakan ke bentuk surat korespondensi.

Pakta Integritas juga punya perbedaan lain: itu pernyataan yang
ditandatangani oleh **peserta seleksi sendiri**, bukan Panitia —
sebelumnya blok tanda tangan selalu menampilkan "Ketua Panitia
Seleksi" untuk semua jenis surat termasuk Pakta Integritas, yang keliru
secara substansi (Panitia tidak menandatangani pernyataan integritas
milik orang lain).

## Perubahan kode

- **`lib/letter-templates.ts`** ditulis ulang total: setiap dari 8 jenis
  surat sekarang punya isi yang jauh lebih lengkap dan terstruktur
  (poin bernomor, blok Hari/Tanggal/Waktu/Tempat, struktur
  Menimbang/Mengingat/Memutuskan untuk Keputusan, dst.), bukan lagi satu
  kalimat generik. Ditambahkan:
  - `layout`: `"korespondensi"` atau `"judul"` per jenis surat.
  - `judulDinas` / `tentang`: teks blok judul untuk layout "judul".
  - `signatureRole`: `"panitia"` atau `"peserta"`.
  - Helper baru `splitParagraphs()` dan `letterHeaderFor()`.
- **Semua 5 tempat yang menampilkan surat** — pratinjau Generator Surat,
  pratinjau halaman Edit, halaman Cetak, unduhan PDF, dan unduhan
  Word — diperbarui agar menampilkan blok judul yang benar untuk jenis
  surat "judul", dan tanda tangan peserta untuk Pakta Integritas.
  Sebelumnya isi surat juga selalu dipaksa jadi satu paragraf rata
  kiri-kanan tanpa jeda baris — sekarang paragraf dan poin bernomor
  tampil dengan jarak dan baris yang benar di ketiga format (cetak,
  PDF, Word).

Isi tiap jenis surat sekarang bisa dijadikan titik awal yang jauh lebih
mendekati naskah dinas resmi — tetap perlu diverifikasi pejabat
berwenang sebelum dipakai sebagai dokumen final, seperti sudah
diingatkan di halaman Generator Surat.

---

Sudah dicek: `npx tsc --noEmit` bersih, `npm run build` sukses (30
route), dan output tiap jenis surat sudah disimulasikan dengan data
contoh untuk memastikan formatnya benar sebelum dikirim.
