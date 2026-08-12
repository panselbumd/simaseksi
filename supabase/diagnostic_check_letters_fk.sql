-- Jalankan di Supabase SQL Editor untuk memastikan apakah foreign key
-- letters.selection_id -> selections.id benar-benar ada di database.

select
  con.conname as nama_constraint,
  con.contype as tipe,           -- 'f' berarti foreign key
  pg_get_constraintdef(con.oid) as definisi
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace nsp on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'letters';
