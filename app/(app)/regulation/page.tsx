import { createClient } from "@/lib/supabase/server";

export default async function RegulationPage() {
  const supabase = createClient();
  const { data: regs } = await supabase.from("regulations").select("*").order("tahun", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Basis Data Regulasi</h1>
      <p className="text-sm text-ink-500 mb-6">Regulasi yang belum diverifikasi ditandai secara eksplisit pada kolom Catatan.</p>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md px-4 py-3 mb-5">
        Sistem tidak mengarang isi regulasi. Item bertanda &quot;NEEDS REGULATORY VALIDATION&quot; wajib divalidasi pihak berwenang.
      </div>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Judul</th><th className="px-4 py-3">Nomor/Tahun</th><th className="px-4 py-3">Status</th>
          </tr></thead>
          <tbody>
            {regs?.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3"><span className="text-[11px] bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full">{r.kategori}</span></td>
                <td className="px-4 py-3">{r.judul}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.nomor} / {r.tahun}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
