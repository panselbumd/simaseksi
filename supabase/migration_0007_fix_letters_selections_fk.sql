-- Migration 0007
-- Perbaikan untuk error "Could not find a relationship between 'letters'
-- and 'selections' in the schema cache".
--
-- migration_0004_letters.sql memakai `create table if not exists`, yang
-- artinya TIDAK melakukan apa-apa kalau tabel `letters` ternyata sudah ada
-- sebelumnya (misalnya sempat dibuat manual lewat Table Editor sebelum
-- migrasi ini pernah dijalankan, atau constraint-nya sempat gagal
-- dibuat/terhapus). Kalau itu yang terjadi, foreign key
-- letters.selection_id -> selections.id tidak pernah benar-benar
-- terpasang — dan `NOTIFY pgrst, 'reload schema'` saja tidak akan
-- menyelesaikannya karena bukan soal cache, tapi relasinya sendiri
-- memang tidak ada.
--
-- Skrip ini memasang constraint tsb kalau belum ada (aman diulang), lalu
-- memberi tahu PostgREST untuk refresh cache-nya.

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'letters'
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ilike '%selections%'
  ) then
    alter table public.letters
      add constraint letters_selection_id_fkey
      foreign key (selection_id) references public.selections(id) on delete cascade;
  end if;
end $$;

NOTIFY pgrst, 'reload schema';
