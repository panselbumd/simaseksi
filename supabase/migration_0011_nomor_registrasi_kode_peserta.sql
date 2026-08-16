-- Migration 0011
-- Nomor Registrasi & Kode Peserta — keduanya format-by-sistem, bukan diisi
-- manual oleh peserta maupun Panitia.
--
--   - Nomor Registrasi: diberikan otomatis begitu form pendaftaran berhasil
--     disimpan (lihat trigger di bawah — berlaku untuk SETIAP pendaftar,
--     terlepas hasil verifikasi berkasnya nanti). Format: REG-{tahun}-{urut
--     4 digit, global per tahun}, mis. REG-2026-0007.
--   - Kode Peserta: baru diberikan ketika seluruh dokumen persyaratan wajib
--     sudah disetujui (APPROVED) Panitia — lihat perubahan pada
--     app/(app)/documents/actions.ts. Format: {inisial jabatan}-{inisial
--     BUMD}-{tahun}-{urut 3 digit per kombinasi jabatan+BUMD+tahun}, mis.
--     DU-PAT-2026-001 (Direktur Utama, Perumdam Among Tirto, urutan ke-1).
--
-- Safe to re-run.

alter table public.applicants add column if not exists nomor_registrasi text;
alter table public.applicants add column if not exists kode_peserta text;

create unique index if not exists uq_applicants_nomor_registrasi
  on public.applicants (nomor_registrasi) where nomor_registrasi is not null;
create unique index if not exists uq_applicants_kode_peserta
  on public.applicants (kode_peserta) where kode_peserta is not null;

comment on column public.applicants.nomor_registrasi is 'Diisi otomatis oleh trigger trg_generate_nomor_registrasi saat pendaftaran disimpan. Format: REG-{tahun}-{urut 4 digit}.';
comment on column public.applicants.kode_peserta is 'Diisi otomatis oleh server action begitu seluruh dokumen wajib berstatus APPROVED (lihat documents/actions.ts). Format: {inisial jabatan}-{inisial BUMD}-{tahun}-{urut 3 digit}.';

create or replace function public.generate_nomor_registrasi()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_seq  int;
begin
  if new.nomor_registrasi is not null then
    return new;
  end if;
  -- Volume pendaftaran per tahun untuk instansi ini rendah (puluhan, bukan
  -- ribuan), jadi count+1 tanpa sequence khusus per-tahun sudah cukup andal
  -- dan tetap sederhana untuk dibaca/diaudit.
  select count(*) + 1 into v_seq
  from public.applicants
  where nomor_registrasi like 'REG-' || v_year || '-%';
  new.nomor_registrasi := 'REG-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_generate_nomor_registrasi on public.applicants;
create trigger trg_generate_nomor_registrasi
  before insert on public.applicants
  for each row execute function public.generate_nomor_registrasi();

NOTIFY pgrst, 'reload schema';
