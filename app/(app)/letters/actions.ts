"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { findTemplate, fillTemplate, fmtTanggalPanjang, CUSTOM_TEMPLATE_ID } from "@/lib/letter-templates";

async function currentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, role: profile?.role as string | undefined };
}

function readCustomFields(formData: FormData) {
  const namaSurat = String(formData.get("nama_surat") || "").trim();
  const customJudul = String(formData.get("custom_judul") || "").trim();
  const customTentang = String(formData.get("custom_tentang") || "").trim();
  const customLayout = String(formData.get("custom_layout") || "korespondensi").trim();
  const customSignature = String(formData.get("custom_signature") || "single").trim();
  if (!namaSurat) throw new Error("Judul/nama naskah wajib diisi untuk Naskah Dinas Kustom.");
  if (!["korespondensi", "judul"].includes(customLayout)) throw new Error("Bentuk naskah tidak dikenali.");
  if (!["single", "table5", "block3", "peserta"].includes(customSignature)) throw new Error("Bentuk tanda tangan tidak dikenali.");
  return {
    nama_surat: namaSurat,
    custom_judul: customJudul || namaSurat.toUpperCase(),
    custom_tentang: customTentang || null,
    custom_layout: customLayout,
    custom_signature: customSignature,
  };
}

// Panitia: susun & simpan draf surat. Untuk template baku, isi dihitung dari
// data seleksi/BUMD terkini kecuali Panitia sudah menuliskan redaksinya
// sendiri di kolom "Isi Naskah" (isi bebas diedit — lihat
// migration_0010_daftar_hadir_dan_naskah_kustom.sql). Untuk Naskah Dinas
// Kustom ("custom"), judul/tentang/bentuk naskah/bentuk tanda tangan juga
// ditentukan Panitia sendiri, bukan dari katalog template.
export async function createLetterAction(formData: FormData) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat membuat draf surat.");

  const jenis_surat = String(formData.get("jenis_surat") || "");
  const selection_id = String(formData.get("selection_id") || "");
  const nomor = String(formData.get("nomor") || "").trim();
  const tanggal = String(formData.get("tanggal") || "");
  const nama_peserta = String(formData.get("nama_peserta") || "").trim();
  const periode = String(formData.get("periode") || "").trim();
  const isiOverride = String(formData.get("isi") || "").trim();

  const isCustom = jenis_surat === CUSTOM_TEMPLATE_ID;
  const tpl = isCustom ? null : findTemplate(jenis_surat);
  if (!isCustom && !tpl) throw new Error("Jenis surat tidak dikenali.");
  if (!selection_id || !nomor || !tanggal) throw new Error("Seleksi, nomor, dan tanggal wajib diisi.");
  if (isCustom && !isiOverride) throw new Error("Isi naskah wajib diisi untuk Naskah Dinas Kustom.");

  const { data: sel } = await supabase
    .from("selections")
    .select("id, jabatan, dasar_hukum, bumds(nama)")
    .eq("id", selection_id)
    .single();
  if (!sel) {
    throw new Error(
      "Seleksi tidak ditemukan atau Anda tidak terdaftar sebagai anggota Panitia Seleksi untuk seleksi ini. " +
      "Jika seharusnya Anda punya akses, pastikan migration_0006_fix_pansel_membership.sql sudah dijalankan di Supabase."
    );
  }

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
  const isi = isiOverride || (tpl ? fillTemplate(tpl.template, data) : "");

  const custom = isCustom ? readCustomFields(formData) : null;

  const { data: inserted, error } = await supabase
    .from("letters")
    .insert({
      selection_id, jenis_surat,
      nama_surat: custom ? custom.nama_surat : (tpl?.nama ?? "Naskah"),
      nomor, tanggal,
      nama_peserta: nama_peserta || null, jabatan: sel.jabatan, periode: periode || null,
      dasar_hukum: sel.dasar_hukum || null, isi, status: "DRAFT",
      custom_judul: custom?.custom_judul ?? null,
      custom_tentang: custom?.custom_tentang ?? null,
      custom_layout: custom?.custom_layout ?? null,
      custom_signature: custom?.custom_signature ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Letter", p_action: "CREATE_LETTER", p_old_value: "-", p_new_value: custom?.nama_surat ?? tpl?.nama ?? "Naskah", p_selection: selection_id,
  });
  revalidatePath("/letters");
  return inserted?.id as string;
}

// Panitia: ubah draf yang sudah tersimpan. Nomor/tanggal/peserta/periode dan
// (untuk Naskah Kustom) judul/tentang/bentuk naskah/tanda tangan bisa
// diubah; redaksi ("Isi Naskah") sekarang SELALU dipakai persis seperti yang
// dituliskan di form — tidak lagi dihitung ulang otomatis dari template
// setiap disimpan, supaya suntingan Panitia atas redaksi tidak pernah
// tertimpa. Hanya berlaku selama draf masih berstatus DRAFT.
export async function updateLetterAction(id: string, formData: FormData) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat mengubah draf surat.");

  const jenis_surat = String(formData.get("jenis_surat") || "");
  const nomor = String(formData.get("nomor") || "").trim();
  const tanggal = String(formData.get("tanggal") || "");
  const nama_peserta = String(formData.get("nama_peserta") || "").trim();
  const periode = String(formData.get("periode") || "").trim();
  const isi = String(formData.get("isi") || "").trim();

  const isCustom = jenis_surat === CUSTOM_TEMPLATE_ID;
  const tpl = isCustom ? null : findTemplate(jenis_surat);
  if (!isCustom && !tpl) throw new Error("Jenis surat tidak dikenali.");
  if (!nomor || !tanggal) throw new Error("Nomor dan tanggal wajib diisi.");
  if (!isi) throw new Error("Isi naskah tidak boleh kosong.");

  const { data: existing, error: findErr } = await supabase
    .from("letters")
    .select("id, status, selection_id")
    .eq("id", id)
    .single();
  if (findErr || !existing) throw new Error("Draf surat tidak ditemukan.");
  if (existing.status !== "DRAFT") throw new Error("Surat yang sudah Final tidak dapat diubah.");

  const custom = isCustom ? readCustomFields(formData) : null;

  const { error } = await supabase
    .from("letters")
    .update({
      jenis_surat,
      nama_surat: custom ? custom.nama_surat : (tpl?.nama ?? "Naskah"),
      nomor, tanggal,
      nama_peserta: nama_peserta || null, periode: periode || null, isi,
      custom_judul: custom?.custom_judul ?? null,
      custom_tentang: custom?.custom_tentang ?? null,
      custom_layout: custom?.custom_layout ?? null,
      custom_signature: custom?.custom_signature ?? null,
    })
    .eq("id", id)
    .eq("status", "DRAFT");
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Letter", p_action: "UPDATE_LETTER", p_old_value: "-", p_new_value: custom?.nama_surat ?? tpl?.nama ?? "Naskah", p_selection: existing.selection_id,
  });
  revalidatePath("/letters");
  revalidatePath(`/letters/${id}/edit`);
}

// Panitia: tandai draf sebagai Final (mengunci nomor/isi sebagai catatan
// audit — surat tetap "bahan bantu", bukan Keputusan resmi; itu tetap lewat
// modul Keputusan yang hanya bisa diterbitkan KPM/Pejabat Berwenang).
export async function finalizeLetterAction(id: string) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat memfinalisasi draf surat.");
  const { data: updated, error } = await supabase.from("letters").update({ status: "FINAL" }).eq("id", id).select("id");
  if (error) throw error;
  if (!updated || updated.length === 0) throw new Error("Surat tidak difinalisasi: tidak ditemukan atau Anda tidak berwenang.");
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
  const { data: deleted, error } = await supabase.from("letters").delete().eq("id", id).eq("status", "DRAFT").select("id");
  if (error) throw error;
  if (!deleted || deleted.length === 0) throw new Error("Draf tidak terhapus: tidak ditemukan, sudah Final, atau Anda tidak berwenang.");
  revalidatePath("/letters");
}
