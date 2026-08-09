"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function currentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, role: profile?.role as string | undefined };
}

// Panitia: buat draf rekomendasi baru untuk sebuah seleksi.
export async function createRecommendationAction(formData: FormData) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat membuat draf rekomendasi.");

  const selection_id = String(formData.get("selection_id") || "");
  const ringkasan = String(formData.get("ringkasan") || "").trim();
  if (!selection_id || !ringkasan) throw new Error("Seleksi dan ringkasan wajib diisi.");

  const { error } = await supabase.from("recommendations").insert({ selection_id, ringkasan, status: "DRAFT" });
  if (error) throw error;

  await supabase.rpc("write_audit_log", { p_module: "Recommendation", p_action: "CREATE_RECOMMENDATION", p_old_value: "-", p_new_value: "DRAFT", p_selection: selection_id });
  revalidatePath("/recommendation");
}

// Panitia: edit ringkasan selama masih DRAFT atau diminta REVISION.
export async function editRecommendationAction(id: string, formData: FormData) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat mengubah draf rekomendasi.");
  const ringkasan = String(formData.get("ringkasan") || "").trim();
  if (!ringkasan) throw new Error("Ringkasan wajib diisi.");

  const { error } = await supabase.from("recommendations").update({ ringkasan }).eq("id", id);
  if (error) throw error; // RLS (recs_update_panitia_draft) blocks this outside DRAFT/REVISION
  revalidatePath("/recommendation");
}

// Panitia: ajukan draf untuk direview KPM/Pejabat Berwenang.
export async function submitForReviewAction(id: string) {
  const { supabase, role } = await currentProfile();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat mengajukan rekomendasi.");
  const { error } = await supabase.from("recommendations").update({ status: "REVIEW" }).eq("id", id);
  if (error) throw error;
  await supabase.rpc("write_audit_log", { p_module: "Recommendation", p_action: "SUBMIT_REVIEW", p_old_value: "DRAFT", p_new_value: "REVIEW", p_selection: "" });
  revalidatePath("/recommendation");
}

// KPM / Pejabat Berwenang: setujui, minta revisi, atau finalisasi.
export async function decideRecommendationAction(id: string, nextStatus: "APPROVED" | "REVISION" | "FINAL") {
  const { supabase, role } = await currentProfile();
  if (role !== "KPM" && role !== "PEJABAT_BERWENANG") throw new Error("Hanya KPM / Pejabat Berwenang yang dapat memutuskan rekomendasi.");

  const { error } = await supabase.from("recommendations").update({ status: nextStatus }).eq("id", id);
  if (error) throw error;
  await supabase.rpc("write_audit_log", { p_module: "Recommendation", p_action: `RECOMMENDATION_${nextStatus}`, p_old_value: "-", p_new_value: nextStatus, p_selection: "" });
  revalidatePath("/recommendation");
}
