-- ============================================================================
-- SIMASEKSI — Migration 0001
-- Untuk project yang sudah pernah menjalankan schema.sql sebelumnya.
-- Jika ini instalasi baru, migration ini SUDAH termasuk di schema.sql —
-- cukup jalankan schema.sql seperti biasa dan lewati file ini.
--
-- Isi migration ini mendukung:
--   1) Admin = 1 akun            -> unique index SYSTEM_ADMIN
--   2) Pansel = 2 (Ketua/Anggota)-> kolom posisi pada selection_members
--   4) Pendaftaran Peserta hanya saat tahapan REGISTRATION dibuka
--      -> RLS applicants_insert_self diperketat
-- Jalankan di Supabase Dashboard -> SQL Editor, setelah schema.sql & seed.sql.
-- ============================================================================

-- 1) Hanya boleh ada 1 akun SYSTEM_ADMIN di seluruh sistem
create unique index if not exists uq_single_system_admin
  on public.profiles ((true))
  where role = 'SYSTEM_ADMIN';

-- 2) Ketua / Anggota Pansel
alter table public.selection_members
  add column if not exists posisi text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'selection_members_posisi_check'
  ) then
    alter table public.selection_members
      add constraint selection_members_posisi_check
      check (posisi in ('KETUA','ANGGOTA'));
  end if;
end $$;

comment on column public.selection_members.posisi is
  'Hanya relevan untuk member_role = PANITIA_SELEKSI: KETUA atau ANGGOTA.';

-- 4) Peserta hanya bisa insert applicants miliknya sendiri SELAMA seleksi
--    berstatus REGISTRATION (tahap pendaftaran resmi sedang dibuka)
drop policy if exists "applicants_insert_self" on public.applicants;
create policy "applicants_insert_self"
  on public.applicants for insert
  with check (
    user_id = auth.uid()
    and public.current_role() = 'PESERTA'
    and exists (
      select 1 from public.selections s
      where s.id = selection_id and s.status = 'REGISTRATION'
    )
  );
