"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Regulasi dapat dikelola oleh Administrator Sistem ATAU Panitia Seleksi
// (lih. migration_0005 & lib/rbac.ts: "regulation.manage"). RLS adalah
// batas otorisasi yang sesungguhnya; assertCanManage() di sini hanya
// memberi pesan error yang lebih jelas sebelum permintaan ditolak Postgres.
async function assertCanManage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "SYSTEM_ADMIN" && profile?.role !== "PANITIA_SELEKSI") {
    throw new Error("Hanya Administrator Sistem atau Panitia Seleksi yang dapat mengelola Basis Data Regulasi.");
  }
  return supabase;
}

export async function createRegulationAction(formData: FormData) {
  const supabase = await assertCanManage();
  const judul = String(formData.get("judul") || "").trim();
  const kategori = String(formData.get("kategori") || "").trim();
  const nomor = String(formData.get("nomor") || "").trim() || null;
  const tahunRaw = String(formData.get("tahun") || "").trim();
  const tahun = tahunRaw ? Number(tahunRaw) : null;
  if (!judul || !kategori) throw new Error("Kategori dan judul regulasi wajib diisi.");

  const { error } = await supabase.from("regulations").insert({
    judul, kategori, nomor, tahun,
    status: "NEEDS_VALIDATION",
    catatan: "NEEDS REGULATORY VALIDATION — wajib diperiksa pihak berwenang sebelum dijadikan dasar hukum resmi.",
  });
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Regulasi", p_action: "CREATE_REGULATION", p_old_value: "-", p_new_value: judul, p_selection: "",
  });
  revalidatePath("/regulation");
}

export async function deleteRegulationAction(id: string, judul: string) {
  const supabase = await assertCanManage();
  const { error } = await supabase.from("regulations").delete().eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Regulasi", p_action: "DELETE_REGULATION", p_old_value: judul, p_new_value: "-", p_selection: "",
  });
  revalidatePath("/regulation");
}

// Menandai regulasi sudah diverifikasi & divalidasi pihak berwenang:
// status -> VERIFIED dan catatan "NEEDS REGULATORY VALIDATION" dibersihkan.
// Sistem sengaja tidak pernah mengarang/mengubah isi regulasi secara
// otomatis — ini murni penanda administratif bahwa manusia sudah mengecek.
export async function verifyRegulationAction(id: string, judul: string) {
  const supabase = await assertCanManage();
  const { error } = await supabase
    .from("regulations")
    .update({ status: "VERIFIED", catatan: null })
    .eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Regulasi", p_action: "VERIFY_REGULATION", p_old_value: "NEEDS_VALIDATION", p_new_value: judul, p_selection: "",
  });
  revalidatePath("/regulation");
}
