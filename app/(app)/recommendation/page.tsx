import { createClient } from "@/lib/supabase/server";
import { createRecommendationAction } from "./actions";
import { RecommendationCard } from "./RecommendationCard";

export default async function RecommendationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role;
  const canEditDraft = role === "PANITIA_SELEKSI";
  const canReview = role === "KPM" || role === "PEJABAT_BERWENANG";

  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("id, selection_id, status, ringkasan, created_at, selections(nama)")
    .order("created_at", { ascending: false });

  // For the "buat rekomendasi baru" form: only selections that don't
  // already have a recommendation in progress, and only within RLS scope.
  const usedSelectionIds = new Set((recommendations ?? []).map((r: any) => r.selection_id));
  const { data: selections } = await supabase.from("selections").select("id, nama").order("tahun", { ascending: false });
  const availableSelections = (selections ?? []).filter((s) => !usedSelectionIds.has(s.id));

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Rekomendasi</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Alur: Draf → Review → Revisi → Disetujui → Final. Panitia Seleksi menyusun dan mengajukan; hanya KPM /
        Pejabat Berwenang yang dapat menyetujui, meminta revisi, dan memfinalisasi — sama seperti Assessment,
        batas kewenangan ini ditegakkan oleh Row Level Security di Postgres, bukan hanya tombol yang disembunyikan.
      </p>

      {canEditDraft && availableSelections.length > 0 && (
        <form action={createRecommendationAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 flex flex-col gap-3">
          <b className="text-sm">Buat Rekomendasi Baru</b>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold mb-1">Seleksi</label>
              <select name="selection_id" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                {availableSelections.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="flex-[2] min-w-[240px]">
              <label className="block text-xs font-semibold mb-1">Ringkasan Awal (opsional)</label>
              <input name="ringkasan" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" placeholder="Dapat diisi/diedit kemudian" />
            </div>
            <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Buat Draf</button>
          </div>
        </form>
      )}

      {!recommendations?.length && (
        <div className="text-sm text-ink-500 bg-white border border-gray-200 rounded-md p-6 text-center">
          Belum ada rekomendasi dalam cakupan Anda.
        </div>
      )}

      {recommendations?.map((r: any) => (
        <RecommendationCard
          key={r.id} id={r.id} selectionId={r.selection_id} selectionName={r.selections?.nama ?? "-"}
          status={r.status} ringkasan={r.ringkasan} canEditDraft={canEditDraft} canReview={canReview}
        />
      ))}
    </div>
  );
}
