import { createClient } from "@/lib/supabase/server";
import {
  createRecommendationAction, editRecommendationAction,
  submitForReviewAction, decideRecommendationAction,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", REVIEW: "Review", REVISION: "Revisi", APPROVED: "Disetujui", FINAL: "Final",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", REVIEW: "bg-blue-50 text-blue-700",
  REVISION: "bg-amber-50 text-amber-700", APPROVED: "bg-green-50 text-green-700",
  FINAL: "bg-navy-900 text-white",
};

export default async function RecommendationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role;

  const { data: recs } = await supabase
    .from("recommendations")
    .select("id, status, ringkasan, created_at, selections(id, nama)")
    .order("created_at", { ascending: false });

  const { data: selections } = await supabase.from("selections").select("id, nama").in("status", ["UKK", "INTERVIEW", "FINALIZATION"]);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Rekomendasi</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Alur: Draf → Review → Revisi → Disetujui → Final. Panitia menyusun &amp; mengajukan; hanya KPM / Pejabat
        Berwenang yang dapat menyetujui, meminta revisi, atau memfinalisasi (RLS <code>recs_approve_kpm</code>).
      </p>

      {role === "PANITIA_SELEKSI" && (
        <form action={createRecommendationAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold mb-1">Seleksi</label>
              <select name="selection_id" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                <option value="">Pilih seleksi...</option>
                {selections?.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Ringkasan Rekomendasi</label>
              <input name="ringkasan" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" placeholder="mis. Merekomendasikan 3 kandidat teratas untuk diangkat..." />
            </div>
          </div>
          <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Buat Draf Rekomendasi</button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {recs?.map((r: any) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <b className="text-sm">{r.selections?.nama}</b>
                <div className="text-[11px] text-ink-500">{new Date(r.created_at).toLocaleDateString("id-ID")}</div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            </div>

            {role === "PANITIA_SELEKSI" && ["DRAFT", "REVISION"].includes(r.status) ? (
              <form action={editRecommendationAction.bind(null, r.id)} className="space-y-2">
                <textarea name="ringkasan" defaultValue={r.ringkasan} rows={2} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
                <div className="flex gap-2">
                  <button type="submit" className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-3 py-1.5">Simpan</button>
                  <button formAction={submitForReviewAction.bind(null, r.id)} className="text-xs bg-navy-900 text-white font-semibold rounded-md px-3 py-1.5">Ajukan Review</button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-ink-700">{r.ringkasan}</p>
            )}

            {(role === "KPM" || role === "PEJABAT_BERWENANG") && r.status === "REVIEW" && (
              <div className="flex gap-2 mt-3">
                <form action={decideRecommendationAction.bind(null, r.id, "APPROVED")}>
                  <button className="text-xs bg-green-600 text-white font-semibold rounded-md px-3 py-1.5">Setujui</button>
                </form>
                <form action={decideRecommendationAction.bind(null, r.id, "REVISION")}>
                  <button className="text-xs bg-amber-500 text-white font-semibold rounded-md px-3 py-1.5">Minta Revisi</button>
                </form>
              </div>
            )}
            {(role === "KPM" || role === "PEJABAT_BERWENANG") && r.status === "APPROVED" && (
              <form action={decideRecommendationAction.bind(null, r.id, "FINAL")} className="mt-3">
                <button className="text-xs bg-navy-900 text-white font-semibold rounded-md px-3 py-1.5">Finalisasi</button>
              </form>
            )}
          </div>
        )) ?? <div className="text-sm text-ink-500">Belum ada rekomendasi.</div>}
      </div>
    </div>
  );
}
