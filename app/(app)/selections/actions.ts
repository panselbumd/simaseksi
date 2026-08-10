"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission, type AppRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Panitia Seleksi (Ketua & Anggota) manage the selections they run;
// RLS (selections_manage_panitia / selections_update_panitia /
// selections_delete_panitia, see migration_0005) is the real authorization
// boundary — this only gives a clearer error before Postgres rejects it.
async function assertCanManage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role as AppRole;
  if (!hasPermission(role, "selection.manage")) {
    throw new Error("Hanya Panitia Seleksi yang dapat menambah/mengubah/menghapus data seleksi.");
  }
  return { supabase, userId: user.id };
}

function readSelectionForm(formData: FormData) {
  const nama = String(formData.get("nama") || "").trim();
  const bumd_id = String(formData.get("bumd_id") || "").trim();
  const jabatan = String(formData.get("jabatan") || "").trim();
  const tahunRaw = String(formData.get("tahun") || "").trim();
  const formasiRaw = String(formData.get("formasi") || "1").trim();
  const selection_type = String(formData.get("selection_type") || "");
  const candidate_source = String(formData.get("candidate_source") || "");
  const dasar_hukum = String(formData.get("dasar_hukum") || "").trim() || null;
  const status = String(formData.get("status") || "DRAFT");
  if (!nama || !bumd_id || !jabatan || !tahunRaw || !selection_type || !candidate_source) {
    throw new Error("Nama, BUMD, jabatan, tahun, tipe seleksi, dan sumber kandidat wajib diisi.");
  }
  return {
    nama, bumd_id, jabatan,
    tahun: Number(tahunRaw),
    formasi: Number(formasiRaw) || 1,
    selection_type, candidate_source, dasar_hukum, status,
  };
}

export async function createSelectionAction(formData: FormData) {
  const { supabase, userId } = await assertCanManage();
  const values = readSelectionForm(formData);

  const { data: created, error } = await supabase
    .from("selections")
    .insert({ ...values, created_by: userId })
    .select("id")
    .single();
  if (error) throw error;

  // Membership is now handled entirely by the trg_add_panitia_members
  // trigger (migration 0006), which adds BOTH active Pansel accounts
  // (Ketua + Anggota) as members — not just the creator — so every
  // Panitia-scoped RLS policy (update, delete, candidates, documents,
  // assessment, etc.) works correctly for either account.

  await supabase.rpc("write_audit_log", {
    p_module: "Seleksi", p_action: "CREATE_SELECTION", p_old_value: "-", p_new_value: values.nama, p_selection: created!.id,
  });
  revalidatePath("/selections");
  redirect("/selections");
}

export async function updateSelectionAction(id: string, formData: FormData) {
  const { supabase } = await assertCanManage();
  const values = readSelectionForm(formData);

  const { error } = await supabase.from("selections").update(values).eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Seleksi", p_action: "UPDATE_SELECTION", p_old_value: id, p_new_value: values.nama, p_selection: id,
  });
  revalidatePath("/selections");
  redirect("/selections");
}

export async function deleteSelectionAction(id: string, nama: string) {
  const { supabase } = await assertCanManage();
  const { data: deleted, error } = await supabase.from("selections").delete().eq("id", id).select("id");
  if (error) throw error;
  // Supabase's delete() does NOT throw when RLS silently filters out every
  // row it would have matched — it just returns 0 affected rows. Checking
  // explicitly turns that into a visible error instead of a button that
  // looks like it worked but left the record untouched.
  if (!deleted || deleted.length === 0) {
    throw new Error("Seleksi tidak terhapus: Anda bukan anggota Panitia Seleksi untuk seleksi ini.");
  }

  await supabase.rpc("write_audit_log", {
    p_module: "Seleksi", p_action: "DELETE_SELECTION", p_old_value: nama, p_new_value: "-", p_selection: "",
  });
  revalidatePath("/selections");
}
