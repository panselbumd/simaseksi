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
    return { error: "Password salah. Silakan coba kembali." };
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
