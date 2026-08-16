"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = { error?: string } | null;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const supabase = await createClient();

  // Username -> synthetic email lookup (see get_login_email() in schema.sql).
  const { data: email, error: lookupError } = await supabase.rpc("get_login_email", { p_username: username });
  if (lookupError || !email) {
    return { error: "Username tidak ditemukan atau akun tidak aktif." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    // Pesan sebelumnya SELALU menampilkan "Password salah" untuk jenis
    // kegagalan apa pun dari signInWithPassword — termasuk penyebab yang
    // sama sekali bukan password (project Supabase pause/nonaktif, email
    // belum dikonfirmasi, akun diblokir sementara, kredensial API salah,
    // dsb) — sehingga menyesatkan saat mendiagnosis masalah login.
    // Sekarang pesan Supabase yang sesungguhnya ditampilkan supaya jelas
    // penyebabnya, dengan terjemahan untuk kasus paling umum.
    const raw = signInError.message || "";
    if (/invalid login credentials/i.test(raw)) {
      return { error: "Password salah, atau akun belum pernah login sebelumnya dengan password ini. Silakan coba kembali." };
    }
    if (/email not confirmed/i.test(raw)) {
      return { error: "Akun belum terverifikasi (email not confirmed) di Supabase Auth. Hubungi Administrator Sistem." };
    }
    return { error: `Gagal masuk: ${raw || "kesalahan tidak diketahui"}. Jika ini muncul untuk SEMUA akun (bukan hanya satu), kemungkinan besar penyebabnya di sisi konfigurasi Supabase (project nonaktif/pause, atau environment variable Supabase URL/Anon Key di Vercel tidak sesuai), bukan di kode aplikasi.` };
  }

  await supabase.rpc("write_audit_log", {
    p_module: "Authentication", p_action: "LOGIN", p_old_value: "-", p_new_value: "-", p_selection: "",
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.rpc("write_audit_log", {
    p_module: "Authentication", p_action: "LOGOUT", p_old_value: "-", p_new_value: "-", p_selection: "",
  });
  await supabase.auth.signOut();
  redirect("/");
}
