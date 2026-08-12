-- Migration 0006
-- Bug: "Hapus" (and every other Panitia-scoped action — edit, candidates,
-- documents, assessment, etc.) silently did nothing for whichever Pansel
-- account did NOT create the selection.
--
-- Root cause: createSelectionAction only ever inserted a selection_members
-- row for the *creator*. Every RLS policy in schema.sql (selections update/
-- delete, candidates, documents, assessment, interview, ranking, letters...)
-- gates PANITIA_SELEKSI access on public.is_selection_member(id, ...). So
-- the second Pansel account (e.g. anggota2_pansel) was never a member of
-- any selection created by the other Pansel account, and Postgres RLS
-- rejected their writes silently (Supabase's .delete()/.update() do not
-- throw when RLS filters out all matching rows — they just affect 0 rows).
--
-- SIMASEKSI's design is exactly one Pansel team of 2 accounts (Ketua +
-- Anggota, see comment on selection_members.posisi in schema.sql) who
-- jointly manage every selection — so both must always be members.
--
-- Fix: a trigger that adds every active PANITIA_SELEKSI profile as a
-- member whenever a selection is created (replacing the app-level insert
-- in createSelectionAction), plus a one-time backfill for selections that
-- already exist.
--
-- Safe to re-run.

create or replace function public.add_panitia_members_on_selection_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.selection_members (selection_id, user_id, member_role, posisi)
  select new.id, p.id, 'PANITIA_SELEKSI',
         case when p.id = new.created_by then 'KETUA' else 'ANGGOTA' end
  from public.profiles p
  where p.role = 'PANITIA_SELEKSI' and p.active = true
  on conflict (selection_id, user_id, member_role) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_add_panitia_members on public.selections;
create trigger trg_add_panitia_members
  after insert on public.selections
  for each row execute function public.add_panitia_members_on_selection_insert();

-- Backfill: add any currently-active Pansel account that is missing from
-- selection_members on a selection that already exists (covers selections
-- created before this migration, and any account activated afterwards but
-- before its first selection).
insert into public.selection_members (selection_id, user_id, member_role, posisi)
select s.id, p.id, 'PANITIA_SELEKSI',
       case when p.id = s.created_by then 'KETUA' else 'ANGGOTA' end
from public.selections s
cross join public.profiles p
where p.role = 'PANITIA_SELEKSI' and p.active = true
on conflict (selection_id, user_id, member_role) do nothing;

-- Beritahu PostgREST agar refresh cache skema (tabel/relasi baru dari
-- migrasi ini langsung dikenali tanpa perlu restart manual).
NOTIFY pgrst, 'reload schema';
