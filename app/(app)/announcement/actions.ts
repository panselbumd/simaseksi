"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertPanitiaOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "PANITIA_SELEKSI" && profile?.role !== "SYSTEM_ADMIN") {
    throw new Error("Hanya Panitia Seleksi / Administrator yang dapat mengelola pengumuman.");
  }
  return supabase;
}

export async function createAnnouncementAction(formData: FormData) {
  const supabase = await assertPanitiaOrAdmin();
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const selection_id = String(formData.get("selection_id") || "") || null;
  const content = String(formData.get("content") || "").trim();
  const publish_date = String(formData.get("publish_date") || "") || null;
  const status = String(formData.get("status") || "DRAFT");
  if (!title || !content) throw new Error("Judul dan isi pengumuman wajib diisi.");

  const { error } = await supabase.from("announcements").insert({
    title, category, selection_id, content, publish_date, status,
  });
  if (error) throw error;

  await supabase.rpc("write_audit_log", { p_module: "Announcement", p_action: "CREATE_ANNOUNCEMENT", p_old_value: "-", p_new_value: title, p_selection: "" });
  revalidatePath("/announcement");
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  const supabase = await assertPanitiaOrAdmin();
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const selection_id = String(formData.get("selection_id") || "") || null;
  const content = String(formData.get("content") || "").trim();
  const publish_date = String(formData.get("publish_date") || "") || null;
  const status = String(formData.get("status") || "DRAFT");
  if (!title || !content) throw new Error("Judul dan isi pengumuman wajib diisi.");

  const { data: updated, error } = await supabase
    .from("announcements")
    .update({ title, category, selection_id, content, publish_date, status })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!updated || updated.length === 0) throw new Error("Pengumuman tidak ditemukan atau Anda tidak berwenang mengubahnya.");

  await supabase.rpc("write_audit_log", { p_module: "Announcement", p_action: "UPDATE_ANNOUNCEMENT", p_old_value: "-", p_new_value: title, p_selection: "" });
  revalidatePath("/announcement");
}

export async function setAnnouncementStatusAction(id: string, status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED") {
  const supabase = await assertPanitiaOrAdmin();
  const { error } = await supabase.from("announcements").update({ status }).eq("id", id);
  if (error) throw error;
  await supabase.rpc("write_audit_log", { p_module: "Announcement", p_action: `ANNOUNCEMENT_${status}`, p_old_value: "-", p_new_value: status, p_selection: "" });
  revalidatePath("/announcement");
}

export async function deleteAnnouncementAction(id: string) {
  const supabase = await assertPanitiaOrAdmin();
  const { data: deleted, error } = await supabase.from("announcements").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!deleted || deleted.length === 0) throw new Error("Pengumuman tidak ditemukan atau Anda tidak berwenang menghapusnya.");
  await supabase.rpc("write_audit_log", { p_module: "Announcement", p_action: "DELETE_ANNOUNCEMENT", p_old_value: id, p_new_value: "-", p_selection: "" });
  revalidatePath("/announcement");
}
