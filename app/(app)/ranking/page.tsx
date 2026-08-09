import { createClient } from "@/lib/supabase/server";

const THRESHOLDS = [
  { min: 85, max: 100, label: "Sangat Disarankan" },
  { min: 75, max: 84.99, label: "Disarankan" },
  { min: 70, max: 74.99, label: "Disarankan dengan Pengembangan" },
  { min: 0, max: 69.99, label: "Tidak Disarankan" },
];
function recommendationLabel(score: number | null) {
  if (score === null) return "-";
  return THRESHOLDS.find((t) => score >= t.min && score <= t.max)?.label ?? "-";
}

export default async function RankingPage() {
  const supabase = await createClient();
  // Reads the auto-computed view — ranking can never be typed in by hand.
  const { data: ranking } = await supabase
    .from("v_candidate_ranking").select("*").order("ranking", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-display font-bold text-navy-900">Ranking</h1>
        <a href="/ranking/export.csv" className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-3 py-1.5">Unduh CSV</a>
      </div>
      <p className="text-sm text-ink-500 mb-6">Dihitung otomatis oleh view <code>v_candidate_ranking</code> — tidak ada jalur input manual di aplikasi maupun database.</p>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
              <th className="px-4 py-3">Ranking</th><th className="px-4 py-3">Kandidat</th>
              <th className="px-4 py-3">Final Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Rekomendasi (Preview)</th>
            </tr>
          </thead>
          <tbody>
            {ranking?.map((r, i) => (
              <tr key={r.candidate_id} className="border-t border-gray-100">
                <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-gold-100 text-gold-700" : "bg-navy-50 text-navy-800"}`}>#{r.ranking}</span></td>
                <td className="px-4 py-3 font-medium">{r.nama}</td>
                <td className="px-4 py-3 font-mono font-bold">{r.final_score ?? "-"}</td>
                <td className="px-4 py-3">{r.complete ? <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Lengkap</span> : <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Belum Lengkap</span>}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{recommendationLabel(r.final_score)}</span></td>
              </tr>
            )) ?? <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">Belum ada nilai final yang lengkap.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-500 mt-3">Threshold di atas hanyalah contoh prototype dan harus disesuaikan dengan Juklak/Juknis serta ketentuan yang berlaku.</p>
    </div>
  );
}
