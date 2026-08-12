# Kalau NOTIFY reload schema saja belum cukup — 11 Agustus 2026

## Kemungkinan penyebab sebenarnya

`NOTIFY pgrst, 'reload schema'` hanya memperbaiki masalah kalau
constraint-nya **memang ada** di database tapi PostgREST belum tahu.
Kalau errornya masih persis sama setelah itu dijalankan, kemungkinan
besar constraint-nya **memang tidak pernah terpasang** —
`migration_0004_letters.sql` memakai `create table if not exists`, yang
artinya tidak melakukan apa-apa kalau tabel `letters` ternyata sudah
sempat dibuat sebelumnya (misalnya lewat Table Editor, atau migrasi
sempat gagal di tengah jalan lalu tabelnya "setengah jadi").

## Langkah sekarang

1. **(Opsional, untuk memastikan)** Jalankan
   `supabase/diagnostic_check_letters_fk.sql` di SQL Editor — kalau hasil
   query kosong (tidak ada baris dengan tipe `f`/foreign key), itu
   konfirmasi bahwa constraint-nya memang tidak ada.

2. **Jalankan `supabase/migration_0007_fix_letters_selections_fk.sql`.**
   Skrip ini memasang foreign key `letters.selection_id →
   selections.id` kalau belum ada (aman diulang berkali-kali, tidak akan
   error walau constraint-nya sudah ada), lalu otomatis memberi tahu
   PostgREST untuk refresh cache-nya di baris terakhir.

## Perubahan kode tambahan (jaga-jaga)

Supaya halaman Generator Surat khususnya tidak lagi bisa terganjal oleh
masalah relasi/cache PostgREST sama sekali, `app/(app)/letters/page.tsx`
sekarang **tidak lagi memakai fitur "embed" Supabase** (`selections(nama)`)
untuk mengambil nama seleksi di daftar Draf Tersimpan — datanya diambil
terpisah lalu digabung manual di kode, jadi tidak bergantung pada
PostgREST berhasil mendeteksi foreign key ini sama sekali.

Halaman lain (Cetak, Edit, Unduh Word/PDF, Laporan Naskah Dinas) masih
memakai embed seperti biasa — begitu migration_0007 dijalankan,
semuanya akan otomatis ikut berfungsi karena memakai relasi yang sama
persis.

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses — 30
route ter-generate tanpa error.
