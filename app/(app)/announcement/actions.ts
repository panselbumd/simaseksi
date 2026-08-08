"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// RLS "announcements_manage_panitia" (PANITIA_SELEKSI / SYSTEM_ADMIN, ALL
// commands) is the real gate here — every action below fails at the
// database if called by any other role, regardless of what the UI shows.

export async function createAnnouncementAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const selectionId = String(formData.get("selection_id") || "") || null;
  const publishDate = String(formData.get("publish_date") || "") || null;
  if (!title || !content) throw new Error("Judul dan isi pengumuman wajib diisi.");

  const { error } = await supabase.from("announcements").insert({
    title, category: category || null, content, selection_id: selectionId,
    publish_date: publishDate, status: "DRAFT", created_by: user.id,
  });
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Announcement", p_action: "CREATE_ANNOUNCEMENT", p_old_value: "-", p_new_value: title, p_selection: selectionId ?? "",
  });
  revalidatePath("/announcement");
}

export async function setAnnouncementStatusAction(id: string, status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED") {
  const supabase = createClient();
  const { error } = await supabase.from("announcements").update({ status }).eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Announcement", p_action: "UPDATE_ANNOUNCEMENT_STATUS", p_old_value: "-", p_new_value: status, p_selection: "",
  });
  revalidatePath("/announcement");
}

export async function deleteAnnouncementAction(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;

  await supabase.rpc("write_audit_log", {
    p_module: "Announcement", p_action: "DELETE_ANNOUNCEMENT", p_old_value: id, p_new_value: "-", p_selection: "",
  });
  revalidatePath("/announcement");
}
