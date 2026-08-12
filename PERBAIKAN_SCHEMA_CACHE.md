# Ketemu! Penyebab sebenarnya: PostgREST schema cache belum di-refresh — 11 Agustus 2026

## Pesan error yang akhirnya terlihat (berkat perbaikan sesi sebelumnya)

> Gagal memuat daftar draf surat: Could not find a relationship between
> 'letters' and 'selections' in the schema cache

## Penyebab

Relasi (foreign key) `letters.selection_id → selections.id` **sudah
benar** di database sejak `migration_0004_letters.sql`. Tapi Supabase
melayani semua query dari supabase-js lewat lapisan API bernama
**PostgREST**, dan PostgREST menyimpan cache skema database miliknya
sendiri secara terpisah dari database itu sendiri — termasuk daftar
foreign key, yang dipakai untuk fitur "embed" seperti
`selections(nama)` yang dipakai di query Generator Surat.

Kalau tabel/relasi baru dibuat lewat **SQL Editor manual** (seperti yang
kita lakukan selama ini), PostgREST **tidak otomatis tahu** ada
perubahan — beda dengan migrasi lewat Supabase CLI/Dashboard Migrations
yang biasanya memicu refresh otomatis. Cache-nya baru diperbarui kalau
diberi tahu secara eksplisit, atau menunggu restart berkala.

## Perbaikan

**Jalankan sekarang di Supabase SQL Editor** — file baru
`supabase/RELOAD_SCHEMA_CACHE_SEKARANG.sql`, isinya cuma satu baris:

```sql
NOTIFY pgrst, 'reload schema';
```

Ini seharusnya langsung menuntaskan error tersebut tanpa perlu ubah kode
apa pun lagi — coba jalankan lalu langsung tes "Simpan Draf" lagi (tidak
perlu redeploy aplikasi untuk perbaikan yang satu ini, karena ini murni
di sisi Supabase).

## Supaya tidak terulang di migrasi berikutnya

Baris `NOTIFY pgrst, 'reload schema';` yang sama sekarang juga sudah
ditambahkan di **akhir setiap file migrasi** (`migration_0001` sampai
`migration_0006`) — jadi kalau suatu saat Anda menjalankan ulang salah
satu migrasi (semuanya aman diulang / idempotent), cache PostgREST akan
otomatis ikut ter-refresh tanpa perlu langkah manual terpisah lagi.

---

Catatan: perubahan kode dari sesi-sesi sebelumnya (penanganan error yang
menampilkan pesan asli, dsb.) tetap dipertahankan di paket ini — itu
juga bermanfaat untuk kasus lain di masa depan, terlepas dari perbaikan
spesifik di atas.
