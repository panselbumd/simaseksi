-- SIMASEKSI — Migration 0003: bersihkan duplikat di public.regulations
-- dan cegah duplikat serupa terjadi lagi.
--
-- Penyebab: tabel `regulations` tidak punya unique constraint apa pun sejak
-- awal (lihat schema.sql), sehingga menjalankan seed.sql lebih dari sekali
-- (umum terjadi saat setup/troubleshooting) langsung menghasilkan baris
-- ganda tanpa ditolak database. Migration ini idempotent — aman dijalankan
-- berkali-kali.
--
-- Jalankan di Supabase Dashboard → SQL Editor, SETELAH schema.sql dan
-- seed.sql. Baca langkah 0 dan 3 dulu sebelum menjalankan seluruh file.

-- =====================================================================
-- LANGKAH 0 — PERIKSA DULU sebelum menghapus apa pun (read-only)
-- Kelompok duplikat ditentukan oleh kombinasi (kategori, nomor, tahun)
-- setelah normalisasi spasi/huruf — ini identitas hukum sebuah regulasi,
-- bukan `judul` (yang bisa sedikit berbeda pengetikan padahal regulasi
-- yang sama).
-- =====================================================================
select
  kategori, lower(trim(nomor)) as nomor_normalized, tahun,
  count(*) as jumlah_duplikat,
  array_agg(id order by created_at) as id_list,
  array_agg(nomor order by created_at) as nomor_variants,  -- lihat di sini kalau penulisannya beda2
  array_agg(judul order by created_at) as judul_list,
  array_agg(status order by created_at) as status_list
from public.regulations
group by kategori, lower(trim(nomor)), tahun
having count(*) > 1
order by tahun desc;

-- Tinjau hasilnya dulu. Setiap baris di atas = satu kelompok duplikat.
-- Langkah 1 di bawah akan MENYIMPAN satu baris "terbaik" per kelompok dan
-- MENGHAPUS sisanya — prioritas baris yang disimpan: status paling matang
-- (VERIFIED > REFERENCE > NEEDS_VALIDATION > DRAFT > ARCHIVED), lalu yang
-- catatan-nya paling lengkap (tidak kosong), lalu yang paling lama dibuat
-- (created_at paling awal, karena itu biasanya entri asli sebelum re-seed).

-- =====================================================================
-- LANGKAH 1 — Hapus duplikat, simpan satu baris terbaik per kelompok
-- =====================================================================
with ranked as (
  select
    id,
    row_number() over (
      partition by kategori, lower(trim(coalesce(nomor, ''))), tahun
      order by
        case status
          when 'VERIFIED' then 1
          when 'REFERENCE' then 2
          when 'NEEDS_VALIDATION' then 3
          when 'DRAFT' then 4
          when 'ARCHIVED' then 5
          else 6
        end,
        (catatan is null or catatan = '') asc,  -- baris dengan catatan diutamakan
        created_at asc
    ) as rn
  from public.regulations
)
delete from public.regulations
where id in (select id from ranked where rn > 1);

-- =====================================================================
-- LANGKAH 2 — Cegah duplikat terulang di masa depan
-- Unique index parsial: hanya berlaku untuk baris yang punya nomor terisi
-- (beberapa regulasi internal seperti SOP draft mungkin belum bernomor).
-- =====================================================================
create unique index if not exists uq_regulations_kategori_nomor_tahun
  on public.regulations (kategori, lower(trim(nomor)), tahun)
  where nomor is not null and nomor <> '';

-- =====================================================================
-- LANGKAH 3 — VERIFIKASI HASIL (jalankan setelah langkah 1 & 2 selesai)
-- Query ini HARUS mengembalikan 0 baris. Kalau masih ada hasil, berarti
-- ada regulasi dengan nomor yang sama tapi ditulis dengan kategori
-- berbeda (mis. "PP" vs "Peraturan Pemerintah") — itu perlu diperbaiki
-- manual (satukan penulisan kategorinya) sebelum dianggap valid & selesai.
-- =====================================================================
select kategori, lower(trim(nomor)) as nomor_normalized, tahun, count(*)
from public.regulations
group by kategori, lower(trim(nomor)), tahun
having count(*) > 1;
