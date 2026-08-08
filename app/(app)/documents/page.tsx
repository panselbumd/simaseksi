import { createClient } from "@/lib/supabase/server";
import { REQUIRED_DOCUMENTS } from "./constants";
import { uploadDocumentAction, verifyDocumentAction, getSignedDocumentUrl } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  NOT_UPLOADED: "Belum Diunggah", UPLOADED: "Menunggu Verifikasi", UNDER_REVIEW: "Sedang Diperiksa",
  VALID: "Valid", INVALID: "Tidak Valid", REVISION_REQUIRED: "Perlu Perbaikan", APPROVED: "Disetujui",
};
const STATUS_COLOR: Record<string, string> = {
  NOT_UPLOADED: "bg-gray-100 text-gray-500", UPLOADED: "bg-blue-50 text-blue-700", UNDER_REVIEW: "bg-blue-50 text-blue-700",
  VALID: "bg-green-50 text-green-700", APPROVED: "bg-green-50 text-green-700",
  INVALID: "bg-red-50 text-red-700", REVISION_REQUIRED: "bg-amber-50 text-amber-700",
};

export default async function DocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role;

  if (role === "PESERTA") {
    const { data: applicant } = await supabase
      .from("applicants").select("id, selection_id, selections(nama)").eq("user_id", user!.id).maybeSingle();

    if (!applicant) {
      return (
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Dokumen</h1>
          <p className="text-sm text-ink-500">Anda belum terdaftar pada seleksi mana pun. Silakan daftar terlebih dahulu melalui halaman pendaftaran publik.</p>
        </div>
      );
    }

    const { data: docs } = await supabase
      .from("documents").select("*").eq("owner_type", "APPLICANT").eq("owner_id", applicant.id);

    return (
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Dokumen Persyaratan</h1>
        <p className="text-sm text-ink-500 mb-6">{(applicant as any).selections?.nama} — unggah seluruh berkas persyaratan di bawah ini (maks. 5MB per berkas, PDF/JPG/PNG).</p>

        <div className="flex flex-col gap-3">
          {REQUIRED_DOCUMENTS.map((jenis) => {
            const doc = docs?.find((d) => d.jenis === jenis);
            const status = doc?.status ?? "NOT_UPLOADED";
            const boundUpload = uploadDocumentAction.bind(null, applicant.selection_id, jenis);
            return (
              <div key={jenis} className="bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium">{jenis}</div>
                  <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
                  {doc?.catatan && <div className="text-xs text-amber-700 mt-1">Catatan Panitia: {doc.catatan}</div>}
                </div>
                <form action={boundUpload} encType="multipart/form-data" className="flex items-center gap-2">
                  <input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png" className="text-xs" />
                  <button type="submit" className="text-xs bg-navy-900 text-white font-semibold rounded-md px-3 py-1.5 whitespace-nowrap">
                    {doc ? "Ganti" : "Unggah"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Staff view (Panitia / Admin / Auditor / KPM / Pejabat Berwenang): verifikasi.
  const { data: docs } = await supabase
    .from("documents")
    .select("id, jenis, status, storage_path, catatan, tanggal, applicants:owner_id(nama), selections(nama)")
    .order("tanggal", { ascending: false });

  const canVerify = role === "PANITIA_SELEKSI";

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Verifikasi Dokumen</h1>
      <p className="text-sm text-ink-500 mb-6">
        {canVerify
          ? "Periksa kelengkapan dan keabsahan berkas persyaratan setiap peserta."
          : "Tampilan baca-saja — hanya Panitia Seleksi yang memiliki hak verifikasi (RLS documents_verify_panitia)."}
      </p>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Peserta</th><th className="px-4 py-3">Seleksi</th>
            <th className="px-4 py-3">Jenis Dokumen</th><th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Berkas</th>
            {canVerify && <th className="px-4 py-3">Aksi</th>}
          </tr></thead>
          <tbody>
            {docs?.length ? await Promise.all(docs.map(async (d: any) => {
              const url = d.storage_path ? await getSignedDocumentUrl(d.storage_path).catch(() => null) : null;
              return (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{d.applicants?.nama ?? "-"}</td>
                  <td className="px-4 py-3">{d.selections?.nama}</td>
                  <td className="px-4 py-3">{d.jenis}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[d.status]}`}>{STATUS_LABEL[d.status]}</span></td>
                  <td className="px-4 py-3">{url ? <a href={url} target="_blank" className="text-xs text-navy-700 underline">Lihat</a> : <span className="text-xs text-ink-400">-</span>}</td>
                  {canVerify && (
                    <td className="px-4 py-3">
                      <form action={verifyDocumentAction.bind(null, d.id, "VALID")} className="inline">
                        <button className="text-[11px] bg-green-600 text-white font-semibold rounded-md px-2 py-1 mr-1">Valid</button>
                      </form>
                      <form action={verifyDocumentAction.bind(null, d.id, "REVISION_REQUIRED")} className="inline">
                        <button className="text-[11px] bg-amber-500 text-white font-semibold rounded-md px-2 py-1 mr-1">Perbaikan</button>
                      </form>
                      <form action={verifyDocumentAction.bind(null, d.id, "INVALID")} className="inline">
                        <button className="text-[11px] bg-red-600 text-white font-semibold rounded-md px-2 py-1">Tolak</button>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })) : <tr><td colSpan={canVerify ? 6 : 5} className="px-4 py-8 text-center text-ink-500">Belum ada dokumen diunggah.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
