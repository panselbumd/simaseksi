"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "SYSTEM_ADMIN") throw new Error("Hanya Administrator Sistem yang dapat mengelola user.");
  return supabase;
}

// NOTE: this is the ONLY place in the app that touches the service-role
// client — required because creating/disabling auth.users rows needs admin
// API access that RLS-scoped clients don't have. It deliberately does NOT
// touch assessment_scores, recommendations, or decisions: those stay
// completely out of reach for SYSTEM_ADMIN, by design.
export async function createUserAction(formData: FormData) {
  await assertAdmin();
  const admin = createServiceRoleClient();

  const username = String(formData.get("username") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "");
  const unit = String(formData.get("unit") || "");
  const password = String(formData.get("password") || "password123");
  if (!username || !name || !role) throw new Error("Nama, username, dan peran wajib diisi.");

  const email = `${username}@simaseksi.local`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: data.user!.id, username, name, role, unit, active: true,
  });
  if (profileErr) throw profileErr;

  await createClient().rpc("write_audit_log", {
    p_module: "User", p_action: "CREATE_USER", p_old_value: "-", p_new_value: username, p_selection: "",
  });
  revalidatePath("/users");
}

export async function toggleUserActiveAction(userId: string, nextActive: boolean) {
  const supabase = await assertAdmin();
  const { error } = await supabase.from("profiles").update({ active: nextActive }).eq("id", userId);
  if (error) throw error;
  await supabase.rpc("write_audit_log", {
    p_module: "User", p_action: nextActive ? "UPDATE_USER" : "DISABLE_USER",
    p_old_value: nextActive ? "INACTIVE" : "ACTIVE", p_new_value: nextActive ? "ACTIVE" : "INACTIVE", p_selection: "",
  });
  revalidatePath("/users");
}
