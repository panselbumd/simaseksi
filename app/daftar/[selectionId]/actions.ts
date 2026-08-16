"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type RegisterState = { error?: string } | null;

// Public, unauthenticated action. Anyone can call this, so every field that
// matters for authorization is HARD-CODED here (role: PESERTA, active:
// true) — nothing from the form can escalate privilege. The service-role
// client is required only because creating an auth.users row needs the
// Admin API; RLS on every other table still applies normally afterwards.
export async function registerAction(
  selectionId: string,
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const admin = createServiceRoleClient();

  // 1) The selection must actually be open for registration RIGHT NOW —
  //    checked here for a friendly message, and enforced again, structurally,
  //    by the applicants_insert_self RLS policy below (belt & suspenders).
  const { data: selection } = await admin
    .from("selections")
    .select("id, nama, status")
    .eq("id", selectionId)
    .single();
  if (!selection) return { error: "Seleksi tidak ditemukan." };
  if (selection.status !== "REGISTRATION") {
    return { error: "Tahapan pendaftaran untuk seleksi ini belum atau tidak lagi dibuka." };
  }

  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nama = String(formData.get("nama") || "").trim();
  const tempat_lahir = String(formData.get("tempat_lahir") || "").trim();
  const tanggal_lahir = String(formData.get("tanggal_lahir") || "") || null;
  const pendidikan_terakhir = String(formData.get("pendidikan_terakhir") || "").trim();
  const pengalaman_tahun = Number(formData.get("pengalaman_tahun") || 0);
  const jabatan_terakhir = String(formData.get("jabatan_terakhir") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const telepon = String(formData.get("telepon") || "").trim();

  if (!username || !password || !nama || !email) {
    return { error: "Nama, username, password, dan email wajib diisi." };
  }
  if (!/^[a-z0-9._-]{4,32}$/.test(username)) {
    return { error: "Username 4-32 karakter, hanya huruf kecil/angka/titik/underscore/strip." };
  }
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  const { data: existing } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (existing) return { error: "Username sudah digunakan. Silakan pilih username lain." };

  const loginEmail = `${username}@simaseksi.local`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: loginEmail, password, email_confirm: true,
  });
  if (createErr) return { error: `Gagal membuat akun: ${createErr.message}` };
  const userId = created.user!.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId, username, name: nama, role: "PESERTA", unit: "-", active: true,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId); // roll back orphaned auth user
    return { error: `Gagal menyimpan profil: ${profileErr.message}` };
  }

  const { data: insertedApplicant, error: applicantErr } = await admin.from("applicants").insert({
    selection_id: selectionId,
    user_id: userId,
    nama,
    tempat_lahir: tempat_lahir || null,
    tanggal_lahir,
    pendidikan_terakhir: pendidikan_terakhir || null,
    pengalaman_tahun: pengalaman_tahun || null,
    jabatan_terakhir: jabatan_terakhir || null,
    email,
    telepon: telepon || null,
    status: "VERIFICATION",
  }).select("nomor_registrasi").single();
  if (applicantErr) {
    // Account exists but application failed — leave the account (they can
    // still log in) but surface the error so they can retry/contact admin.
    return { error: `Akun dibuat, tetapi gagal menyimpan data pendaftaran: ${applicantErr.message}. Silakan masuk lalu hubungi Panitia Seleksi.` };
  }

  // Audit trail: use a direct insert (service role bypasses RLS) instead of
  // the write_audit_log() RPC, since that RPC is granted to `authenticated`
  // only and there is no session yet for this brand-new anonymous signup.
  await admin.from("audit_logs").insert({
    user_id: userId, username, role: "PESERTA", selection: selection.nama,
    module: "Applicant", action: "PUBLIC_REGISTER", old_value: "-", new_value: username,
  });

  // Nomor Registrasi (format by sistem — lihat trigger
  // generate_nomor_registrasi(), migration_0011) sudah pasti terisi begitu
  // insert di atas sukses. Ditampilkan di halaman berhasil lewat query
  // string supaya halaman itu tidak perlu query ulang / login dulu.
  redirect(`/daftar/${selectionId}/berhasil?reg=${encodeURIComponent(insertedApplicant?.nomor_registrasi || "")}`);
}
