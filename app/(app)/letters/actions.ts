"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { findTemplate, fillTemplate, fmtTanggalPanjang } from "@/lib/letter-templates";

async function currentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, role: profile?.role as string | undefined };
}

// Panitia: susun & simpan draf surat. Isi surat dihitung ulang di server dari
// data seleksi/BUMD terkini (bukan dari input client) supaya draf yang
// tersimpan selalu konsisten dengan sumber data resmi.
export async function createLetterAction(formData: FormData) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat membuat draf surat.");

  const jenis_surat = String(formData.get("jenis_surat") || "");
  const selection_id = String(formData.get("selection_id") || "");
  const nomor = String(formData.get("nomor") || "").trim();
  const tanggal = String(formData.get("tanggal") || "");
  const nama_peserta = String(formData.get("nama_peserta") || "").trim();
  const periode = String(formData.get("periode") || "").trim();

  const tpl = findTemplate(jenis_surat);
  if (!tpl) throw new Error("Jenis surat tidak dikenali.");
  if (!selection_id || !nomor || !tanggal) throw new Error("Seleksi, nomor, dan tanggal wajib diisi.");

  const { data: sel } = await supabase
    .from("selections")
    .select("id, jabatan, dasar_hukum, bumds(nama)")
    .eq("id", selection_id)
    .single();
  if (!sel) throw new Error("Seleksi tidak ditemukan.");

  const bumdNama = (sel as any).bumds?.nama || "-";
  const panitia = `Panitia Seleksi ${sel.jabatan} ${bumdNama}`;
  const data: Record<string, string> = {
    NOMOR: nomor,
    TANGGAL: fmtTanggalPanjang(tanggal),
    BUMD: bumdNama,
    NAMA_PESERTA: nama_peserta || "[Nama Peserta]",
    JABATAN: sel.jabatan,
    PERIODE: periode || "-",
    DASAR_HUKUM: sel.dasar_hukum || "—",
    PANITIA: panitia,
    TIM_UKK: "Tim Uji Kompetensi dan Kelayakan",
  };
  const isi = fillTemplate(tpl.template, data);

  const { data: inserted, error } = await supabase
    .from("letters")
    .insert({
      selection_id, jenis_surat, nama_surat: tpl.nama, nomor, tanggal,
      nama_peserta: nama_peserta || null, jabatan: sel.jabatan, periode: periode || null,
      dasar_hukum: sel.dasar_hukum || null, isi, status: "DRAFT",
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Letter", p_action: "CREATE_LETTER", p_old_value: "-", p_new_value: tpl.nama, p_selection: selection_id,
  });
  revalidatePath("/letters");
  return inserted?.id as string;
}

// Panitia: tandai draf sebagai Final (mengunci nomor/isi sebagai catatan
// audit — surat tetap "bahan bantu", bukan Keputusan resmi; itu tetap lewat
// modul Keputusan yang hanya bisa diterbitkan KPM/Pejabat Berwenang).
export async function finalizeLetterAction(id: string) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat memfinalisasi draf surat.");
  const { error } = await supabase.from("letters").update({ status: "FINAL" }).eq("id", id);
  if (error) throw error;
  await supabase.rpc("write_audit_log", {
    p_module: "Letter", p_action: "FINALIZE_LETTER", p_old_value: "DRAFT", p_new_value: "FINAL", p_selection: "",
  });
  revalidatePath("/letters");
}

// Panitia: hapus draf — hanya selama masih berstatus DRAFT (surat FINAL
// dipertahankan sebagai jejak audit dan tidak bisa dihapus dari UI).
export async function deleteLetterAction(id: string) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat menghapus draf surat.");
  const { error } = await supabase.from("letters").delete().eq("id", id).eq("status", "DRAFT");
  if (error) throw error;
  revalidatePath("/letters");
}
