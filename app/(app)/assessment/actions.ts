"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Upserts one component score for the CURRENT user only. RLS
 * (scores_insert_own_ukk / scores_update_own_ukk_unlocked) is the real
 * enforcement — this action cannot write another UKK member's score or
 * touch a locked row even if called directly, because Postgres will reject
 * it regardless of what the client sends.
 */
export async function saveScoreAction(input: {
  selectionId: string; candidateId: string; componentId: string; score: number;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("assessment_scores").upsert(
    {
      selection_id: input.selectionId, candidate_id: input.candidateId, component_id: input.componentId,
      ukk_user_id: user.id, score: input.score, locked: false, updated_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id,component_id,ukk_user_id" }
  );
  if (error) throw error;
  revalidatePath("/assessment");
}

/**
 * Locks ALL of the current UKK member's scores for one candidate at once.
 * Requires every active component to already have a score (mirrors the
 * prototype's "Lengkapi seluruh komponen sebelum submit" guard) — checked
 * here AND by the fact that the UI disables the button until complete.
 */
export async function submitAssessmentAction(selectionId: string, candidateId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: components } = await supabase
    .from("assessment_components").select("id").eq("selection_id", selectionId).eq("active", true);
  const { data: scores } = await supabase
    .from("assessment_scores").select("component_id, score")
    .eq("candidate_id", candidateId).eq("ukk_user_id", user.id);

  const scoredIds = new Set((scores ?? []).filter((s) => s.score !== null).map((s) => s.component_id));
  const missing = (components ?? []).some((c) => !scoredIds.has(c.id));
  if (missing) throw new Error("Lengkapi seluruh komponen penilaian sebelum submit.");

  const { error: lockErr } = await supabase
    .from("assessment_scores").update({ locked: true, submitted_at: new Date().toISOString() })
    .eq("candidate_id", candidateId).eq("ukk_user_id", user.id);
  if (lockErr) throw lockErr;

  await supabase.from("assessments").upsert(
    { selection_id: selectionId, candidate_id: candidateId, ukk_user_id: user.id, status: "LOCKED" },
    { onConflict: "selection_id,candidate_id,ukk_user_id" }
  );

  await supabase.rpc("write_audit_log", {
    p_module: "Assessment", p_action: "SUBMIT_ASSESSMENT", p_old_value: "DRAFT", p_new_value: "LOCKED", p_selection: selectionId,
  });

  revalidatePath("/assessment");
  revalidatePath("/ranking");
}
