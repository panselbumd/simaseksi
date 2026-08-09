import { createClient } from "@/lib/supabase/server";

export default async function CandidatesPage() {
  const supabase = await createClient();
  const { data: candidates } = await supabase
    .from("candidates").select("id, nama, source_type, status, selections(nama)");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Kandidat</h1>
      <p className="text-sm text-ink-500 mb-6">Kandidat resmi hasil verifikasi (Applicant) maupun eligibility (Internal Nominee).</p>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Seleksi</th><th className="px-4 py-3">Sumber</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {candidates?.map((c: any) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{c.nama}</td>
                <td className="px-4 py-3">{c.selections?.nama}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full">{c.source_type === "APPLICANT" ? "Pendaftar Terbuka" : "Nominasi Internal"}</span></td>
                <td className="px-4 py-3"><span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{c.status}</span></td>
              </tr>
            )) ?? <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-500">Belum ada kandidat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
