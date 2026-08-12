-- Jalankan di Supabase SQL Editor dan kirimkan HASILNYA (bukan cuma
-- statusnya) — supaya perbaikannya bisa dipastikan aman, bukan tebakan.

-- 1) Kolom apa saja yang SEBENARNYA ada di tabel public.letters saat ini?
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'letters'
order by ordinal_position;

-- 2) Berapa baris data yang sudah ada di sana? (menentukan aman/tidaknya
--    perbaikan otomatis di migration_0008)
select count(*) as jumlah_baris from public.letters;
