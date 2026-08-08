"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// RLS "decisions_insert_kpm" is the only policy on public.decisions — no
// UPDATE/DELETE policy exists for any role, and SYSTEM_ADMIN/PANITIA_SELEKSI
// have no INSERT policy either. That structurally enforces "only KPM /
// Pejabat Berwenang decide" and makes every decision append-only, the same
// way the audit trail is append-only.
export async function issueDecisionAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const selectionId = String(formData.get("selection_id") || "");
  const recommendationId = String(formData.get("recommendation_id") || "");
  const nomor = String(formData.get("nomor") || "").trim();
  const tanggal = String(formData.get("tanggal") || "") || undefined;
  if (!selectionId || !recommendationId || !nomor) {
    throw new Error("Seleksi, rekomendasi rujukan, dan nomor SK wajib diisi.");
  }

  const { error } = await supabase.from("decisions").insert({
    selection_id: selectionId, recommendation_id: recommendationId, nomor, tanggal,
    status: "FINALIZED", decided_by: user.id,
  });
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Decision", p_action: "ISSUE_DECISION", p_old_value: "-", p_new_value: nomor, p_selection: selectionId,
  });
  revalidatePath("/decision");
}
