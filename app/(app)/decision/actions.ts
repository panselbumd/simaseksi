"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function issueDecisionAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "KPM" && profile?.role !== "PEJABAT_BERWENANG") {
    throw new Error("Hanya KPM / Pejabat Berwenang yang dapat menerbitkan keputusan.");
  }

  const selection_id = String(formData.get("selection_id") || "");
  const recommendation_id = String(formData.get("recommendation_id") || "") || null;
  const nomor = String(formData.get("nomor") || "").trim();
  const tanggal = String(formData.get("tanggal") || "") || undefined;
  if (!selection_id || !nomor) throw new Error("Seleksi dan nomor keputusan wajib diisi.");

  const { error } = await supabase.from("decisions").insert({
    selection_id, recommendation_id, nomor, tanggal, status: "FINALIZED", decided_by: user.id,
  });
  if (error) throw error; // RLS decisions_insert_kpm is the only INSERT path — Admin/Panitia get PostgREST 403 here

  await supabase.rpc("write_audit_log", {
    p_module: "Decision", p_action: "ISSUE_DECISION", p_old_value: "-", p_new_value: nomor, p_selection: "",
  });
  revalidatePath("/decision");
}
