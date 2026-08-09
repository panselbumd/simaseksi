"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "SYSTEM_ADMIN") throw new Error("Hanya Administrator Sistem yang dapat mengelola Basis Data Regulasi.");
  return supabase;
}

// Sesuai regulations_manage_admin di schema.sql — hanya SYSTEM_ADMIN yang
// punya policy INSERT/UPDATE/DELETE pada tabel ini. RLS adalah batas
// otorisasi yang sesungguhnya; assertAdmin() di sini hanya memberi pesan
// error yang lebih jelas sebelum permintaan ditolak Postgres.
export async function deleteRegulationAction(id: string, judul: string) {
  const supabase = await assertAdmin();
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
  const supabase = await assertAdmin();
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
