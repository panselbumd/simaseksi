# Ternyata lebih dalam dari sekadar FK — tabel `letters` strukturnya salah — 12 Agustus 2026

## Yang terungkap dari error terakhir

```
ERROR: 42703: column "selection_id" referenced in foreign key
constraint does not exist
```

Ini artinya kolom `selection_id` **sama sekali tidak ada** di tabel
`public.letters` Anda saat ini. Bukan cuma foreign key yang hilang —
strukturnya memang tidak sesuai dengan yang seharusnya
(`migration_0004_letters.sql`). Kemungkinan besar inilah akar masalah
"Simpan Draf tidak berfungsi" sejak laporan pertama Anda.

## Langkah perbaikan — urutan yang disarankan

1. **(Opsional tapi disarankan)** Jalankan
   `supabase/diagnostic_letters_table_structure.sql` dulu di SQL Editor
   dan lihat hasilnya — supaya Anda tahu persis apa yang ada di sana
   sebelum diubah.

2. **Jalankan `supabase/migration_0008_rebuild_letters_table.sql`.**
   Skrip ini otomatis memeriksa dulu apakah aman untuk diperbaiki:
   - Kalau tabel `letters` **kosong** (kemungkinan besar — karena semua
     percobaan simpan draf selama ini selalu gagal), tabelnya akan
     dibuat ulang otomatis dengan struktur yang benar. **Tidak ada
     data yang hilang** karena memang belum ada data tersimpan di sana.
   - Kalau **ternyata sudah ada data**, skrip ini akan **berhenti
     dengan pesan error** tanpa mengubah apa pun — supaya data tidak
     berisiko hilang. Kalau ini yang terjadi pada Anda, JANGAN
     dipaksakan — kirimkan hasil dari diagnostic di langkah 1 ke saya,
     supaya saya bisa siapkan skrip migrasi yang memindahkan data lama
     ke struktur baru dengan aman.

3. **Jalankan `supabase/migration_0007_fix_letters_selections_fk.sql`**
   setelahnya, sebagai jaring pengaman tambahan (aman diulang, tidak
   akan melakukan apa-apa kalau constraint-nya sudah ada dari langkah
   2).

Setelah ketiga langkah ini, coba lagi "Simpan Draf" di Generator Surat.

---

Tidak ada perubahan kode aplikasi di sesi ini — murni perbaikan skema
database, karena akar masalahnya memang di sana.
