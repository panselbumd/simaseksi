import { createClient } from "@/lib/supabase/server";
import { REPORT_DEFS } from "@/lib/reports";

export default async function ReportsPage() {
  const supabase = await createClient();
  const counts = await Promise.all(REPORT_DEFS.map((r) => r.fetch(supabase).then((rows) => rows.length)));

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Laporan</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Ekspor laporan dalam format CSV (kompatibel Excel/Office) atau cetak melalui pratinjau cetak.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {REPORT_DEFS.map((r, i) => (
          <div key={r.key} className="bg-white border border-gray-200 rounded-md p-5">
            <div className="font-display font-bold text-sm text-navy-900 mb-1">{r.label}</div>
            <div className="text-xs text-ink-500 mb-4">{counts[i]} baris data</div>
            <div className="flex gap-2">
              <a href={`/reports/${r.key}/export.csv`} className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-3 py-1.5 hover:bg-navy-100">
                Unduh CSV
              </a>
              <a href={`/reports/${r.key}/cetak`} target="_blank" rel="noreferrer" className="text-xs border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50">
                Cetak
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
