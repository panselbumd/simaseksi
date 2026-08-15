// Menarik identitas penanda tangan naskah dinas (Nama + NIP) langsung dari
// data akun Panitia Seleksi / Tim UKK yang terdaftar pada sebuah seleksi
// (public.selection_members × public.profiles), bukan lagi placeholder
// kosong. Satu-satunya sumber kebenaran untuk blok tanda tangan di halaman
// cetak, PDF, dan Word — ketiganya memanggil fetchSignatureData() yang sama
// supaya tidak pernah drift satu sama lain.
//
// Lihat migration_0009_identitas_panitia.sql: profiles.jabatan_tim (Ketua /
// Sekretaris / Anggota) adalah atribut identitas akun Panitia, disalin ke
// selection_members.posisi saat akun tsb didaftarkan ke suatu seleksi.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Signer = { nama: string; nip: string | null };

export type SignatureData = {
  ketua: Signer | null;
  sekretaris: Signer | null;
  /** Anggota Panitia selain Ketua/Sekretaris — bisa lebih dari satu. */
  anggota: Signer[];
  /** Tim Uji Kompetensi dan Kelayakan (idealnya 5 orang). */
  timUkk: Signer[];
};

const EMPTY_SIGNATURE: SignatureData = { ketua: null, sekretaris: null, anggota: [], timUkk: [] };

export async function fetchSignatureData(supabase: SupabaseClient, selectionId: string): Promise<SignatureData> {
  const { data: members } = await supabase
    .from("selection_members")
    .select("member_role, posisi, profiles(name, nip)")
    .eq("selection_id", selectionId);

  if (!members) return EMPTY_SIGNATURE;

  const result: SignatureData = { ketua: null, sekretaris: null, anggota: [], timUkk: [] };

  for (const m of members as any[]) {
    const profile = m.profiles;
    if (!profile?.name) continue;
    const signer: Signer = { nama: profile.name, nip: profile.nip ?? null };

    if (m.member_role === "PANITIA_SELEKSI") {
      if (m.posisi === "KETUA") result.ketua = signer;
      else if (m.posisi === "SEKRETARIS") result.sekretaris = signer;
      else result.anggota.push(signer);
    } else if (m.member_role === "TIM_UKK") {
      result.timUkk.push(signer);
    }
  }

  return result;
}

/** Nama tampil "( ... )" — placeholder titik-titik bila akun belum diisi. */
export function signerNameOr(signer: Signer | null, fallback = "................................................"): string {
  return signer?.nama || fallback;
}

export function signerNipLine(signer: Signer | null): string {
  return signer?.nip ? `NIP. ${signer.nip}` : "NIP. ...........................";
}
