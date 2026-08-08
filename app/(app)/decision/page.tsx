import { createClient } from "@/lib/supabase/server";
import { IssueDecisionForm } from "./IssueDecisionForm";

export default async function DecisionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const canIssue = profile?.role === "KPM" || profile?.role === "PEJABAT_BERWENANG";

  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, nomor, tanggal, status, recommendation_id, selections(nama), recommendations(ringkasan)")
    .order("tanggal", { ascending: false });

  // Only FINAL recommendations that don't already have a decision issued
  // against them are eligible — mirrors the one-decision-per-recommendation
  // expectation without needing a DB constraint for it.
  const decidedRecIds = new Set((decisions ?? []).map((d: any) => d.recommendation_id).filter(Boolean));
  let eligible: any[] = [];
  if (canIssue) {
    const { data: finals } = await supabase
      .from("recommendations")
      .select("id, selection_id, ringkasan, selections(nama)")
      .eq("status", "FINAL");
    eligible = (finals ?? []).filter((r: any) => !decidedRecIds.has(r.id));
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Keputusan</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Hanya KPM / Pejabat Berwenang yang memiliki RLS INSERT policy (<code>decisions_insert_kpm</code>) pada
        tabel <code>public.decisions</code> — Panitia dan Administrator Sistem tidak diberi hak ini sama sekali,
        sesuai aturan &quot;Admin ≠ Selection Authority&quot;. Sekali diterbitkan, sebuah Keputusan tidak dapat
        diubah maupun dihapus (append-only), sama seperti Audit Trail.
      </p>

      {canIssue && (
        eligible.length > 0 ? (
          <IssueDecisionForm eligible={eligible} />
        ) : (
          <div className="text-xs text-ink-500 bg-navy-50 border border-navy-100 rounded-md p-3 mb-6">
            Belum ada Rekomendasi berstatus <b>Final</b> yang menunggu Keputusan. Lihat halaman Rekomendasi.
          </div>
        )
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Nomor SK</th><th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Seleksi</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {decisions?.map((d: any) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono font-medium">{d.nomor}</td>
                <td className="px-4 py-3">{d.tanggal}</td>
                <td className="px-4 py-3">{d.selections?.nama}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{d.status}</span></td>
              </tr>
            )) ?? <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-500">Belum ada Keputusan yang diterbitkan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
