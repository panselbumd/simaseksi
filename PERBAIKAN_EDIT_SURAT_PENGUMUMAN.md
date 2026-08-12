# Cara mengedit draf surat/pengumuman/undangan — 12 Agustus 2026

## Surat & Undangan (semuanya jenis surat di Generator Surat)

Fitur Edit untuk ini **sudah ada** sejak beberapa sesi lalu, tapi
tombolnya kurang menonjol — terselip di antara banyak tombol lain. Sudah
saya perbaiki:

- Tombol **"✎ Edit"** sekarang jadi tombol **paling pertama** dan
  **berwarna solid navy** (paling menonjol) di setiap baris draf, baik
  di halaman **Generator Surat** (`/letters`) maupun di halaman
  **Manajemen Seleksi → Cetak/Unduh Surat** (`/selections/[id]/surat`).
- Tombol ini hanya muncul untuk draf berstatus **Draf** (bukan Final) —
  surat yang sudah difinalisasi memang sengaja tidak bisa diedit lagi
  (jadi jejak audit resmi).
- "Undangan" bukan modul terpisah — itu salah satu pilihan **Jenis
  Surat** di Generator Surat, jadi cara edit-nya sama persis dengan
  surat lain: klik "✎ Edit" pada baris draf tersebut.

## Pengumuman

Ini yang ternyata memang **belum ada fiturnya sama sekali** — sebelumnya
menu Pengumuman hanya bisa Buat, Publikasikan/Arsipkan, dan Hapus, tanpa
cara mengubah isi yang sudah tersimpan. Sudah ditambahkan:

- `updateAnnouncementAction` (baru) di `app/(app)/announcement/actions.ts`.
- Di halaman Pengumuman, setiap pengumuman sekarang punya tombol
  **"Edit"** yang membuka form inline (judul, kategori, tanggal
  publikasi, seleksi terkait, status, dan isi) langsung di tempat —
  tidak perlu pindah halaman.

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses — 30
route ter-generate tanpa error.
