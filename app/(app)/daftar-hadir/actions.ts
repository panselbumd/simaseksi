"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function currentRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, role: profile?.role as string | undefined };
}

// Panitia: buat Daftar Hadir (Lampiran L-01) untuk suatu rapat/kegiatan
// seleksi — dipakai berulang di hampir seluruh Berita Acara. Baris untuk
// Ketua/Sekretaris/Anggota/Tim UKK diisi otomatis saat cetak (lihat
// app/(print)/daftar-hadir/[id]/page.tsx dan lib/letter-signature.ts);
// `baris_kosong` menambah baris kosong untuk tamu/peserta yang hadir.
export async function createAttendanceSheetAction(formData: FormData) {
  const { supabase, role } = await currentRole();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat membuat Daftar Hadir.");

  const selection_id = String(formData.get("selection_id") || "");
  const judul_kegiatan = String(formData.get("judul_kegiatan") || "").trim();
  const tanggal = String(formData.get("tanggal") || "");
  const tempat = String(formData.get("tempat") || "").trim();
  const baris_kosong = Math.max(0, Math.min(40, parseInt(String(formData.get("baris_kosong") || "10"), 10) || 0));
  const letter_id = String(formData.get("letter_id") || "").trim();

  if (!selection_id || !judul_kegiatan || !tanggal) throw new Error("Seleksi, judul kegiatan, dan tanggal wajib diisi.");

  const { error } = await supabase.from("attendance_sheets").insert({
    selection_id, judul_kegiatan, tanggal, tempat: tempat || null, baris_kosong,
    letter_id: letter_id || null,
  });
  if (error) throw error;

  revalidatePath(`/selections/${selection_id}/surat`);
}

export async function deleteAttendanceSheetAction(id: string, selectionId: string) {
  const { supabase, role } = await currentRole();
  if (role !== "PANITIA_SELEKSI") throw new Error("Hanya Panitia Seleksi yang dapat menghapus Daftar Hadir.");
  const { error } = await supabase.from("attendance_sheets").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/selections/${selectionId}/surat`);
}
