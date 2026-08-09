import { createClient } from "@/lib/supabase/server";
import { hasPermission, type AppRole } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import SelectionForm from "../../SelectionForm";
import { updateSelectionAction } from "../../actions";

export default async function EditSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role as AppRole;
  if (!hasPermission(role, "selection.manage")) redirect("/selections");

  const { data: selection } = await supabase
    .from("selections")
    .select("id, nama, jabatan, tahun, formasi, bumd_id, selection_type, candidate_source, dasar_hukum, status")
    .eq("id", id)
    .single();
  if (!selection) notFound();

  const { data: bumds } = await supabase.from("bumds").select("id, nama").order("nama");
  const boundAction = updateSelectionAction.bind(null, id);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Ubah Seleksi</h1>
      <p className="text-sm text-ink-500 mb-6">{selection.nama}</p>
      <SelectionForm action={boundAction} bumds={bumds ?? []} initial={selection} submitLabel="Simpan Perubahan" />
    </div>
  );
}
