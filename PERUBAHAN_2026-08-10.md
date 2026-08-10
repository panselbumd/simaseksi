# Perubahan — 10 Agustus 2026

## 1. Langkah wajib sebelum deploy: jalankan migration baru

Jalankan isi `supabase/migration_0006_fix_pansel_membership.sql` di Supabase SQL
Editor. Aman dijalankan berkali-kali (idempotent).

**Kenapa perlu:** tombol "Hapus" (dan sebenarnya semua aksi Panitia Seleksi lain
— edit, kandidat, dokumen, penilaian, dst.) diam-diam gagal untuk salah satu
akun Pansel (mis. `anggota2_pansel`), karena saat sebuah seleksi dibuat, hanya
akun **pembuatnya** yang otomatis dicatat sebagai anggota (`selection_members`).
Semua RLS policy mensyaratkan user menjadi anggota seleksi tsb, jadi akun Pansel
yang satunya lagi ditolak Postgres — dan Supabase `.delete()` tidak melempar
error saat RLS menolak, hanya menghapus 0 baris, jadi terlihat seperti tombolnya
"tidak berfungsi" tanpa pesan error.

Migration ini menambahkan trigger yang otomatis mencatat **kedua** akun Pansel
(Ketua & Anggota) sebagai anggota setiap seleksi baru dibuat, plus backfill
untuk seleksi yang sudah ada.

## 2. Keluar → kembali ke Beranda

`app/login/actions.ts`: `logoutAction` sekarang redirect ke `/` (Beranda),
bukan `/login`.

## 3. Tombol Hapus di Manajemen Seleksi

- Migration di atas memperbaiki akar masalahnya (RLS).
- `app/(app)/selections/actions.ts`: `deleteSelectionAction` sekarang
  memeriksa apakah delete benar-benar mengenai baris data; jika tidak (mis.
  RLS menolak karena alasan lain), sekarang melempar error yang jelas alih-alih
  gagal diam-diam.
- `app/(app)/selections/DeleteSelectionButton.tsx`: ditulis ulang agar
  menampilkan pesan error tsb ke layar dan me-refresh tabel setelah berhasil
  hapus (sebelumnya tidak ada penanganan error/refresh sama sekali).

## 4. Tool navigasi di sidebar & layar utama

- **Sidebar**: tombol naik/turun sendiri (`components/SidebarScrollButtons.tsx`)
  di bawah daftar menu, terpisah dari scroll layar utama.
- **Layar utama**: tombol mengambang naik/turun/kiri/kanan
  (`components/MainScrollControls.tsx`) di pojok kanan bawah setiap halaman
  — berguna terutama untuk tabel lebar (Ranking, Audit Trail, dll).

## 5. Mode gelap/terang

- `tailwind.config.ts`: `darkMode: "class"`.
- `components/ThemeToggle.tsx`: tombol toggle (ikon matahari/bulan) di header,
  preferensi disimpan di `localStorage` sehingga tetap konsisten antar sesi.
- `app/layout.tsx`: script kecil yang menerapkan tema sebelum halaman
  ter-render, supaya tidak ada "kedipan" warna salah saat pindah halaman.
- `app/globals.css`: override gelap untuk class Tailwind yang berulang di
  seluruh aplikasi (`bg-white`, `border-gray-200`, `text-ink-*`, dst.),
  sehingga hampir semua halaman otomatis mengikuti mode gelap tanpa perlu
  menyunting satu-per-satu dari ~30 file halaman.

## 6. Kop surat pakai file jpg/png asli

File `KOP_PANSEL_PERUMDAM.png` dan `KOP_PANSEL_PT_BWR.png` yang sudah ada di
`assets-reference/` disalin ke `public/kop-surat/` dan sekarang dipakai
sebagai **satu gambar banner utuh** (bukan lagi ikon kecil + teks yang
disusun ulang manual) di:

- Pratinjau Generator Surat (`GeneratorForm.tsx`)
- Halaman Cetak (`letters/[id]/cetak/page.tsx`)
- Unduhan PDF (`letters/[id]/pdf/route.tsx`)
- Unduhan Word/.docx (`letters/[id]/docx/route.ts`)

Jika suatu saat BUMD punya kop surat kustom yang diunggah ke bucket Supabase
Storage `kop-surat` (kolom `bumds.kop_image_path`), itu tetap diprioritaskan
di atas file bawaan ini.

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses tanpa error.
