import { createClient } from "@/lib/supabase/server";
import { hasPermission, type AppRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import SelectionForm from "../SelectionForm";
import { createSelectionAction } from "../actions";

export default async function NewSelectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role as AppRole;
  if (!hasPermission(role, "selection.manage")) redirect("/selections");

  const { data: bumds } = await supabase.from("bumds").select("id, nama").order("nama");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Tambah Seleksi</h1>
      <p className="text-sm text-ink-500 mb-6">Anda akan otomatis terdaftar sebagai Panitia (Ketua) pada seleksi ini.</p>
      <SelectionForm action={createSelectionAction} bumds={bumds ?? []} submitLabel="Simpan Seleksi" />
    </div>
  );
}
