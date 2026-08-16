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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role;

  if (role === "PESERTA") {
    const { data: applicant } = await supabase
      .from("applicants").select("id, selection_id, nomor_registrasi, kode_peserta, status, selections(nama)").eq("user_id", user!.id).maybeSingle();

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
        <p className="text-sm text-ink-500 mb-4">{(applicant as any).selections?.nama} — unggah seluruh berkas persyaratan di bawah ini (maks. 5MB per berkas, PDF/JPG/PNG).</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-1">Nomor Registrasi</div>
            <div className="font-display font-bold text-navy-900">{applicant.nomor_registrasi || "—"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-1">Kode Peserta</div>
            <div className="font-display font-bold text-navy-900">
              {applicant.kode_peserta || <span className="font-normal text-ink-500">Belum diterbitkan — menunggu seluruh berkas disetujui Panitia</span>}
            </div>
          </div>
        </div>

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

  // Rekap by sistem: kelengkapan berkas dihitung otomatis per peserta dari
  // baris documents di atas (bukan dihitung manual oleh Panitia) — begitu
  // seluruh dokumen wajib seorang peserta APPROVED, Kode Peserta sudah
  // otomatis diterbitkan oleh verifyDocumentAction (lihat actions.ts) dan
  // tampil di sini.
  const { data: applicants } = await supabase
    .from("applicants")
    .select("id, nama, nomor_registrasi, kode_peserta, status, selection_id, selections(nama)")
    .order("submitted_at", { ascending: false });

  const docsByApplicant = new Map<string, { jenis: string; status: string }[]>();
  const { data: docsForRecap } = await supabase
    .from("documents").select("owner_id, jenis, status").eq("owner_type", "APPLICANT");
  for (const d of docsForRecap ?? []) {
    const arr = docsByApplicant.get(d.owner_id) ?? [];
    arr.push({ jenis: d.jenis, status: d.status });
    docsByApplicant.set(d.owner_id, arr);
  }

  const APPLICANT_STATUS_LABEL: Record<string, string> = {
    VERIFICATION: "Verifikasi Berjalan", CANDIDATE: "Memenuhi Syarat (Kandidat)", REJECTED: "Tidak Memenuhi Syarat",
  };
  const APPLICANT_STATUS_COLOR: Record<string, string> = {
    VERIFICATION: "bg-blue-50 text-blue-700", CANDIDATE: "bg-green-50 text-green-700", REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Verifikasi Dokumen</h1>
      <p className="text-sm text-ink-500 mb-6">
        {canVerify
          ? "Periksa kelengkapan dan keabsahan berkas persyaratan setiap peserta."
          : "Tampilan baca-saja — hanya Panitia Seleksi yang memiliki hak verifikasi (RLS documents_verify_panitia)."}
      </p>

      <h2 className="text-sm font-display font-bold text-navy-900 mb-2">Rekap Kelengkapan Peserta (otomatis)</h2>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Peserta</th><th className="px-4 py-3">Seleksi</th>
            <th className="px-4 py-3">No. Registrasi</th><th className="px-4 py-3">Kode Peserta</th>
            <th className="px-4 py-3">Berkas Disetujui</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {applicants?.map((a: any) => {
              const list = docsByApplicant.get(a.id) ?? [];
              const approvedCount = REQUIRED_DOCUMENTS.filter((j) => list.some((d) => d.jenis === j && d.status === "APPROVED")).length;
              const complete = approvedCount === REQUIRED_DOCUMENTS.length;
              return (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{a.nama}</td>
                  <td className="px-4 py-3">{a.selections?.nama}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.nomor_registrasi || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.kode_peserta || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${complete ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {approvedCount}/{REQUIRED_DOCUMENTS.length}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${APPLICANT_STATUS_COLOR[a.status]}`}>{APPLICANT_STATUS_LABEL[a.status] ?? a.status}</span></td>
                </tr>
              );
            }) ?? null}
            {(!applicants || applicants.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">Belum ada peserta terdaftar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-500 -mt-6 mb-8">Kode Peserta diterbitkan otomatis oleh sistem begitu seluruh {REQUIRED_DOCUMENTS.length} dokumen wajib seorang peserta berstatus Disetujui — tidak perlu langkah manual tambahan.</p>

      <h2 className="text-sm font-display font-bold text-navy-900 mb-2">Detail per Dokumen</h2>
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
