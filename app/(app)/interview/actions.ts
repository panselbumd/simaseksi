"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertPanitia() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat mengelola jadwal & catatan wawancara.");
  return { supabase, userId: user.id };
}

export async function scheduleInterviewAction(formData: FormData) {
  const { supabase } = await assertPanitia();
  const selection_id = String(formData.get("selection_id") || "");
  const candidate_id = String(formData.get("candidate_id") || "");
  const tanggal = String(formData.get("tanggal") || "") || null;
  const pewawancara = String(formData.get("pewawancara") || "").trim();
  if (!selection_id || !candidate_id) throw new Error("Seleksi dan kandidat wajib dipilih.");

  const { error } = await supabase.from("interviews").insert({ selection_id, candidate_id, tanggal, pewawancara });
  if (error) throw error;
  revalidatePath("/interview");
}

export async function recordInterviewResultAction(id: string, formData: FormData) {
  const { supabase, userId } = await assertPanitia();
  const catatan = String(formData.get("catatan") || "").trim();
  const skorRaw = String(formData.get("skor") || "");
  const rekomendasi = String(formData.get("rekomendasi") || "").trim();
  const skor = skorRaw === "" ? null : Number(skorRaw);
  if (skor !== null && (skor < 0 || skor > 100)) throw new Error("Skor wawancara harus 0-100.");

  const { error } = await supabase.from("interviews")
    .update({ catatan, skor, rekomendasi, created_by: userId })
    .eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", { p_module: "Interview", p_action: "RECORD_INTERVIEW_RESULT", p_old_value: "-", p_new_value: String(skor ?? "-"), p_selection: "" });
  revalidatePath("/interview");
}
