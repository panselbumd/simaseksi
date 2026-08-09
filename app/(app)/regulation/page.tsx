import { createClient } from "@/lib/supabase/server";
import RegulationRowActions from "./RegulationRowActions";

const STATUS_STYLE: Record<string, string> = {
  VERIFIED: "bg-green-50 text-green-700",
  REFERENCE: "bg-blue-50 text-blue-700",
  NEEDS_VALIDATION: "bg-amber-50 text-amber-700",
  DRAFT: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

export default async function RegulationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const isAdmin = profile?.role === "SYSTEM_ADMIN";

  const { data: regs } = await supabase.from("regulations").select("*").order("tahun", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Basis Data Regulasi</h1>
      <p className="text-sm text-ink-500 mb-6">Regulasi yang belum diverifikasi ditandai secara eksplisit pada kolom Status.</p>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md px-4 py-3 mb-5">
        Sistem tidak mengarang isi regulasi. Item berstatus &quot;Perlu Validasi&quot; wajib diperiksa pihak berwenang sebelum ditandai Terverifikasi.
      </div>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Judul</th><th className="px-4 py-3">Nomor/Tahun</th><th className="px-4 py-3">Status</th>
            {isAdmin && <th className="px-4 py-3"></th>}
          </tr></thead>
          <tbody>
            {regs?.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-3"><span className="text-[11px] bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full">{r.kategori}</span></td>
                <td className="px-4 py-3">{r.judul}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.nomor} / {r.tahun}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {r.status === "VERIFIED" ? "Terverifikasi" : r.status === "NEEDS_VALIDATION" ? "Perlu Validasi" : r.status}
                  </span>
                  {r.catatan && <div className="text-[10px] text-amber-700 mt-0.5">{r.catatan}</div>}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <RegulationRowActions id={r.id} judul={r.judul} status={r.status} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
