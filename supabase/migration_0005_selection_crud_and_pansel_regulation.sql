-- Migration 0005
-- 1) Regulasi: Pansel (PANITIA_SELEKSI) may also add/manage regulations,
--    per the go-live spec — Admin's regulation.manage permission is shared
--    with Pansel, not exclusive to Admin.
-- 2) Seleksi CRUD: add an explicit DELETE policy for Panitia (previously
--    only INSERT/UPDATE existed), so the "Hapus Seleksi" button in the
--    app has an RLS rule to authorize against.
-- 3) Seleksi CRUD: fix a chicken-and-egg gap where a brand-new selection
--    had no members yet, so its own creator could not add themself as
--    its first PANITIA_SELEKSI member under the existing "manage_panitia"
--    policy (which required already being a member).
--
-- Safe to re-run: policies are dropped before being recreated.

drop policy if exists "regulations_manage_admin" on public.regulations;
create policy "regulations_manage_admin_pansel" on public.regulations for all
  using (public.is_admin() or public.current_role() = 'PANITIA_SELEKSI')
  with check (public.is_admin() or public.current_role() = 'PANITIA_SELEKSI');

drop policy if exists "selections_delete_panitia" on public.selections;
create policy "selections_delete_panitia"
  on public.selections for delete
  using (
    public.current_role() = 'PANITIA_SELEKSI'
    and public.is_selection_member(id, array['PANITIA_SELEKSI']::app_role[])
  );

-- 3) selection_members_manage_panitia requires the inserting user to
--    ALREADY be a PANITIA_SELEKSI member of the selection — which is
--    impossible for the very first membership row on a brand-new
--    selection (chicken-and-egg). This policy lets the selection's
--    creator add themself as its first PANITIA_SELEKSI member.
drop policy if exists "selection_members_insert_creator" on public.selection_members;
create policy "selection_members_insert_creator"
  on public.selection_members for insert
  with check (
    user_id = auth.uid()
    and member_role = 'PANITIA_SELEKSI'
    and exists (
      select 1 from public.selections s
      where s.id = selection_id and s.created_by = auth.uid()
    )
  );

-- Beritahu PostgREST agar refresh cache skema (tabel/relasi baru dari
-- migrasi ini langsung dikenali tanpa perlu restart manual).
NOTIFY pgrst, 'reload schema';
