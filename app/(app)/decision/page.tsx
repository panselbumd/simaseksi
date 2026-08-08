import { createClient } from "@/lib/supabase/server";
import { issueDecisionAction } from "./actions";

export default async function DecisionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role;

  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, nomor, tanggal, status, selections(nama), recommendations(ringkasan)")
    .order("tanggal", { ascending: false });

  const { data: finalRecs } = await supabase
    .from("recommendations").select("id, ringkasan, selection_id, selections(nama)").eq("status", "FINAL");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Keputusan</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Hanya KPM / Pejabat Berwenang yang memiliki RLS INSERT policy (<code>decisions_insert_kpm</code>) pada tabel
        <code> public.decisions</code> — Panitia dan Administrator Sistem tidak diberi hak ini sama sekali, sesuai
        aturan &quot;Admin ≠ Selection Authority&quot;.
      </p>

      {(role === "KPM" || role === "PEJABAT_BERWENANG") && (
        <form action={issueDecisionAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 grid grid-cols-4 gap-3 items-end">
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1">Rekomendasi Final (referensi)</label>
            <select name="recommendation_id" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
              <option value="">Pilih rekomendasi final...</option>
              {finalRecs?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.selections?.nama} — {r.ringkasan?.slice(0, 40)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Seleksi</label>
            <select name="selection_id" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
              <option value="">Pilih seleksi...</option>
              {finalRecs?.map((r: any) => (
                <option key={r.selection_id} value={r.selection_id}>{r.selections?.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Nomor Keputusan</label>
            <input name="nomor" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" placeholder="mis. 188.4/45/KEP/2026" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Tanggal</label>
            <input name="tanggal" type="date" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
          </div>
          <button type="submit" className="col-span-4 bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Terbitkan Keputusan</button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Nomor</th><th className="px-4 py-3">Seleksi</th>
            <th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {decisions?.map((d: any) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-xs">{d.nomor}</td>
                <td className="px-4 py-3">{d.selections?.nama}</td>
                <td className="px-4 py-3">{d.tanggal ? new Date(d.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-navy-900 text-white px-2 py-0.5 rounded-full">{d.status}</span></td>
              </tr>
            )) ?? <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-500">Belum ada keputusan diterbitkan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
