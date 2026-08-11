import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type AppRole } from "@/lib/rbac";
import { kopBannerAssetFor } from "@/lib/letter-format";
import EditLetterForm from "./EditLetterForm";

export default async function EditLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role as AppRole;

  const { data: letter } = await supabase
    .from("letters")
    .select("*, selections(nama, jabatan, dasar_hukum, bumds(nama, kop_image_path, alamat))")
    .eq("id", id)
    .single();
  if (!letter) notFound();

  const canEdit = hasPermission(role, "letter.manage") && letter.status === "DRAFT";
  const sel = (letter as any).selections;
  const bumdNama: string = sel?.bumds?.nama || "-";
  const kopUrl = kopBannerAssetFor(bumdNama);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-display font-bold text-navy-900">Edit Draf Surat</h1>
        <a href="/letters" className="text-xs text-navy-700 underline">&larr; Kembali ke Generator Surat</a>
      </div>
      <p className="text-sm text-ink-500 mb-6">{letter.nama_surat} — {sel?.nama}</p>

      {!canEdit ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md p-4">
          {letter.status !== "DRAFT"
            ? "Surat ini sudah berstatus Final dan tidak dapat diubah lagi."
            : "Anda tidak berwenang mengubah draf surat ini."}
        </div>
      ) : (
        <EditLetterForm
          letter={{
            id: letter.id,
            jenis_surat: letter.jenis_surat,
            nomor: letter.nomor,
            tanggal: letter.tanggal,
            nama_peserta: letter.nama_peserta || "",
            periode: letter.periode || "",
          }}
          bumdNama={bumdNama}
          jabatan={sel?.jabatan || "-"}
          kopUrl={kopUrl}
        />
      )}
    </div>
  );
}
