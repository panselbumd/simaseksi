-- Migration 0008
-- Perbaikan untuk error "column selection_id ... does not exist" yang
-- muncul saat mencoba menjalankan migration_0007. Ini berarti tabel
-- public.letters di database Anda sama sekali TIDAK cocok dengan struktur
-- yang seharusnya (migration_0004_letters.sql) — bukan cuma kekurangan
-- foreign key.
--
-- Skrip ini MEMERIKSA DULU apakah aman untuk memperbaiki secara otomatis:
--   - Kalau tabel public.letters KOSONG (0 baris) — karena semua percobaan
--     "Simpan Draf" selama ini kemungkinan besar memang selalu gagal —
--     tabelnya akan di-DROP dan dibuat ulang dengan struktur yang benar.
--     Tidak ada data yang hilang karena memang tidak ada data di sana.
--   - Kalau ternyata SUDAH ADA data di tabel itu, skrip ini akan BERHENTI
--     dengan pesan error (tidak melakukan apa-apa) supaya datanya tidak
--     berisiko hilang — kalau ini yang terjadi, jangan lanjutkan sendiri,
--     kirimkan hasil dari supabase/diagnostic_letters_table_structure.sql
--     dulu supaya perbaikannya bisa disesuaikan dengan aman.
--
-- Aman dijalankan berkali-kali.

do $$
declare
  jumlah_baris bigint;
  kolom_ada boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'letters' and column_name = 'selection_id'
  ) into kolom_ada;

  if kolom_ada then
    raise notice 'Kolom selection_id sudah ada — tidak perlu membuat ulang tabel. Menjalankan migration_0007 seharusnya cukup.';
  else
    execute 'select count(*) from public.letters' into jumlah_baris;

    if jumlah_baris > 0 then
      raise exception 'Tabel public.letters berisi % baris data tapi strukturnya tidak sesuai dan tidak punya kolom selection_id. Migrasi otomatis DIHENTIKAN demi keamanan data — mohon kirimkan hasil supabase/diagnostic_letters_table_structure.sql untuk perbaikan manual.', jumlah_baris;
    end if;

    raise notice 'Tabel public.letters kosong dan strukturnya tidak sesuai — membuat ulang dengan struktur yang benar.';

    execute 'drop table public.letters cascade';

    execute $sql$
      create table public.letters (
        id            uuid primary key default gen_random_uuid(),
        selection_id  uuid not null references public.selections(id) on delete cascade,
        jenis_surat   text not null,
        nama_surat    text not null,
        nomor         text not null,
        tanggal       date not null default current_date,
        nama_peserta  text,
        jabatan       text,
        periode       text,
        dasar_hukum   text,
        isi           text not null,
        status        text not null default 'DRAFT' check (status in ('DRAFT','FINAL')),
        created_by    uuid references public.profiles(id),
        created_at    timestamptz not null default now()
      )
    $sql$;

    execute 'alter table public.letters enable row level security';

    execute $sql$
      create policy "letters_select_all" on public.letters for select using (true)
    $sql$;

    execute $sql$
      create policy "letters_manage_panitia" on public.letters for all
        using (public.current_role() = 'PANITIA_SELEKSI')
        with check (public.current_role() = 'PANITIA_SELEKSI')
    $sql$;

    execute $sql$
      create trigger trg_audit_letters
        after insert on public.letters
        for each row execute function public.audit_trigger_generic()
    $sql$;

    raise notice 'Tabel public.letters berhasil dibuat ulang dengan struktur yang benar.';
  end if;
end $$;

NOTIFY pgrst, 'reload schema';
