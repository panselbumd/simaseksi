"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// All four actions below rely on Postgres RLS as the real authorization
// boundary (recs_insert_update_panitia / recs_update_panitia_draft /
// recs_approve_kpm in supabase/schema.sql) — a role without the matching
// policy gets a rejected write from Postgres even if this action is called
// directly, not just a hidden button in the UI.

// PANITIA_SELEKSI only: opens a new DRAFT recommendation for a selection
// that doesn't already have one in progress.
export async function createRecommendationAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const selectionId = String(formData.get("selection_id") || "");
  const ringkasan = String(formData.get("ringkasan") || "").trim();
  if (!selectionId) throw new Error("Pilih seleksi terlebih dahulu.");

  const { error } = await supabase.from("recommendations").insert({
    selection_id: selectionId, ringkasan, status: "DRAFT", created_by: user.id,
  });
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Recommendation", p_action: "CREATE_RECOMMENDATION", p_old_value: "-", p_new_value: "DRAFT", p_selection: selectionId,
  });
  revalidatePath("/recommendation");
}

// PANITIA_SELEKSI only, and only while DRAFT/REVISION (recs_update_panitia_draft).
export async function updateRingkasanAction(id: string, selectionId: string, formData: FormData) {
  const supabase = createClient();
  const ringkasan = String(formData.get("ringkasan") || "").trim();

  const { error } = await supabase.from("recommendations").update({ ringkasan }).eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Recommendation", p_action: "UPDATE_RECOMMENDATION", p_old_value: "-", p_new_value: "-", p_selection: selectionId,
  });
  revalidatePath("/recommendation");
}

// PANITIA_SELEKSI only: DRAFT/REVISION -> REVIEW (send to KPM/Pejabat Berwenang).
export async function submitForReviewAction(id: string, selectionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("recommendations").update({ status: "REVIEW" }).eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Recommendation", p_action: "SUBMIT_FOR_REVIEW", p_old_value: "DRAFT", p_new_value: "REVIEW", p_selection: selectionId,
  });
  revalidatePath("/recommendation");
}

// KPM / Pejabat Berwenang only (recs_approve_kpm) — the only role permitted
// to move a recommendation to APPROVED or send it back to REVISION.
export async function decideRecommendationAction(id: string, selectionId: string, nextStatus: "APPROVED" | "REVISION") {
  const supabase = createClient();
  const { error } = await supabase.from("recommendations").update({ status: nextStatus }).eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Recommendation", p_action: nextStatus === "APPROVED" ? "APPROVE_RECOMMENDATION" : "REQUEST_REVISION",
    p_old_value: "REVIEW", p_new_value: nextStatus, p_selection: selectionId,
  });
  revalidatePath("/recommendation");
}

// KPM / Pejabat Berwenang only: APPROVED -> FINAL. Once FINAL, a
// recommendation becomes eligible to be referenced by a Keputusan (Decision).
export async function finalizeRecommendationAction(id: string, selectionId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("recommendations").update({ status: "FINAL" }).eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Recommendation", p_action: "FINALIZE_RECOMMENDATION", p_old_value: "APPROVED", p_new_value: "FINAL", p_selection: selectionId,
  });
  revalidatePath("/recommendation");
  revalidatePath("/decision");
}
