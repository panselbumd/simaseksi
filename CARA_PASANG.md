# Paket: Generator Surat & Laporan (Dokumen & Laporan)

Berisi file BARU + 3 file yang DIPERBARUI untuk repo `simaseksi-main`.
Semua path di dalam zip ini persis sama dengan struktur repo Anda —
tinggal timpa/tambahkan satu per satu lewat GitHub web UI (Method A),
sesuai cara deploy yang biasa Anda pakai.

## 1. Jalankan migration di Supabase (SQL Editor)
Jalankan isi `supabase/migration_0004_letters.sql`. Aman dijalankan berkali-kali.

## 2. Tambah/timpa file berikut di repo
FILE BARU:
- lib/letter-templates.ts
- lib/letter-format.ts
- lib/reports.ts
- app/(app)/letters/page.tsx
- app/(app)/letters/GeneratorForm.tsx
- app/(app)/letters/actions.ts
- app/(app)/letters/[id]/cetak/page.tsx
- app/(app)/letters/[id]/cetak/PrintButton.tsx
- app/(app)/letters/[id]/docx/route.ts
- app/(app)/letters/[id]/pdf/route.tsx
- app/(app)/reports/page.tsx
- app/(app)/reports/[key]/export.csv/route.ts
- app/(app)/reports/[key]/cetak/page.tsx

FILE YANG DITIMPA (sudah ada di repo Anda, isinya diperbarui):
- app/(app)/layout.tsx → menambahkan menu "Dokumen & Laporan" (Generator Surat, Laporan)
- package.json → menambahkan dependency `docx` dan `@react-pdf/renderer`
- app/(app)/regulation/RegulationRowActions.tsx → **perbaikan bug pre-existing** (bukan bagian dari
  permintaan Anda): file ini meng-import `./actions` padahal file yang ada bernama
  `regulation-actions.ts`. Ini membuat `next build` gagal total sebelum perbaikan. Sudah diverifikasi
  dengan build lokal.

## 3. Install dependency baru
Vercel akan otomatis `npm install` ulang saat build berikutnya karena `package.json` berubah.
Tidak ada langkah manual tambahan di Vercel.

## Yang sudah diverifikasi
- `npx tsc --noEmit` bersih (tanpa error) untuk seluruh proyek.
- `npx next build` (production build, Turbopack) sukses — semua rute baru muncul:
  `/letters`, `/letters/[id]/cetak`, `/letters/[id]/docx`, `/letters/[id]/pdf`,
  `/reports`, `/reports/[key]/cetak`, `/reports/[key]/export.csv`.

## Catatan format & satu keterbatasan yang perlu Anda tahu
- **Word (.docx)**: font "Arial" ditulis sebagai nama font di file — akan tampil Arial asli di
  komputer mana pun yang sudah punya font Arial (praktis semua PC Windows/Office pemerintah).
  Margin 1,5/2,5/2/2 cm, spasi 1,5, rata kiri-kanan, dan blok tanda tangan di kanan (teks di
  dalamnya rata kiri) — semua diatur presisi lewat `lib/letter-format.ts`.
- **PDF**: karena Arial adalah font berlisensi Microsoft dan tidak bisa saya sertakan langsung ke
  dalam kode, PDF memakai **Arimo** — font pengganti yang secara metrik 100% kompatibel dengan
  Arial (dirancang khusus untuk itu), jadi tampilannya nyaris identik. Bila Anda ingin
  menyematkan file Arial asli (mis. dari lisensi Office kantor), tinggal ganti URL font di
  `app/(app)/letters/[id]/pdf/route.tsx` — satu baris `Font.register`.
- **Cetak langsung** (`/letters/[id]/cetak` dan `/reports/[key]/cetak`) memakai CSS `@page` dengan
  margin & font yang sama persis, dibuka di tab baru, tombol "Cetak / Simpan sebagai PDF" memanggil
  dialog print bawaan browser.
- Draf surat wajib disimpan dulu (tombol "Simpan sebagai Draf") sebelum bisa diunduh — supaya
  setiap surat yang diterbitkan tercatat di `audit_logs` (siapa, kapan, jenis surat apa), konsisten
  dengan pola modul Rekomendasi/Keputusan yang sudah ada.
