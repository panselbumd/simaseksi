"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "SYSTEM_ADMIN") throw new Error("Hanya Administrator Sistem yang dapat mengelola user.");
  return { supabase, adminId: user.id };
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
  if (role === "PESERTA") {
    throw new Error("Akun Peserta tidak dibuat di sini — peserta mendaftar mandiri lewat /daftar saat seleksi berstatus REGISTRATION.");
  }

  // Structural rule "Admin = 1 akun" is enforced by a Postgres unique index
  // (uq_single_system_admin); give a friendlier message before hitting it.
  if (role === "SYSTEM_ADMIN") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "SYSTEM_ADMIN");
    if ((count ?? 0) >= 1) throw new Error("Sistem hanya boleh memiliki 1 akun Administrator Sistem. Nonaktifkan atau hapus akun admin lama terlebih dahulu.");
  }

  const email = `${username}@simaseksi.local`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: data.user!.id, username, name, role, unit, active: true,
  });
  if (profileErr) {
    // Roll back the orphaned auth user if the profile insert failed
    // (e.g. duplicate username, or the single-admin constraint).
    await admin.auth.admin.deleteUser(data.user!.id);
    throw profileErr;
  }

  await (await createClient()).rpc("write_audit_log", {
    p_module: "User", p_action: "CREATE_USER", p_old_value: "-", p_new_value: username, p_selection: "",
  });
  revalidatePath("/users");
}

// Edit: nama, unit, peran, dan (opsional) reset password. Username tidak
// diubah di sini karena ia adalah bagian dari login email sintetis
// (username@simaseksi.local) yang sudah tertaut ke auth.users.
export async function updateUserAction(userId: string, formData: FormData) {
  const { adminId } = await assertAdmin();
  const admin = createServiceRoleClient();

  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "");
  const unit = String(formData.get("unit") || "");
  const newPassword = String(formData.get("password") || "").trim();
  if (!name || !role) throw new Error("Nama dan peran wajib diisi.");

  const { data: target } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (target?.role === "SYSTEM_ADMIN" && role !== "SYSTEM_ADMIN" && userId === adminId) {
    throw new Error("Anda tidak dapat mencabut peran Administrator dari akun Anda sendiri saat sedang login.");
  }
  if (role === "SYSTEM_ADMIN" && target?.role !== "SYSTEM_ADMIN") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "SYSTEM_ADMIN");
    if ((count ?? 0) >= 1) throw new Error("Sistem hanya boleh memiliki 1 akun Administrator Sistem.");
  }

  const { error } = await admin.from("profiles").update({ name, role, unit }).eq("id", userId);
  if (error) throw error;

  if (newPassword) {
    const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (pwErr) throw pwErr;
  }

  await (await createClient()).rpc("write_audit_log", {
    p_module: "User", p_action: "UPDATE_USER", p_old_value: target?.role ?? "-", p_new_value: role, p_selection: "",
  });
  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserActiveAction(userId: string, nextActive: boolean) {
  const { supabase, adminId } = await assertAdmin();
  if (userId === adminId && !nextActive) throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
  const { error } = await supabase.from("profiles").update({ active: nextActive }).eq("id", userId);
  if (error) throw error;
  await supabase.rpc("write_audit_log", {
    p_module: "User", p_action: nextActive ? "UPDATE_USER" : "DISABLE_USER",
    p_old_value: nextActive ? "INACTIVE" : "ACTIVE", p_new_value: nextActive ? "ACTIVE" : "INACTIVE", p_selection: "",
  });
  revalidatePath("/users");
}

// Hapus akun permanen. Menghapus auth.users lewat service role akan otomatis
// menghapus baris profiles (on delete cascade). Selalu lebih aman memakai
// "Nonaktifkan" untuk akun yang datanya masih dirujuk (mis. sudah pernah
// menilai UKK) — hapus permanen sebaiknya hanya untuk akun yang dibuat
// keliru dan belum pernah dipakai.
export async function deleteUserAction(userId: string) {
  const { adminId } = await assertAdmin();
  if (userId === adminId) throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  const admin = createServiceRoleClient();

  const { data: target } = await admin.from("profiles").select("username, role").eq("id", userId).single();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;

  await (await createClient()).rpc("write_audit_log", {
    p_module: "User", p_action: "DELETE_USER", p_old_value: target?.username ?? userId, p_new_value: "-", p_selection: "",
  });
  revalidatePath("/users");
}
