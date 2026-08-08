import { createClient } from "@/lib/supabase/server";
import { scheduleInterviewAction, recordInterviewResultAction } from "./actions";

export default async function InterviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role;
  const canManage = role === "PANITIA_SELEKSI";

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id, tanggal, pewawancara, catatan, skor, rekomendasi, candidates(nama), selections(nama)")
    .order("tanggal", { ascending: true });

  const { data: selections } = await supabase.from("selections").select("id, nama").in("status", ["INTERVIEW", "UKK"]);
  const { data: candidates } = await supabase.from("candidates").select("id, nama, selection_id");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Wawancara</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">Jadwal, catatan, dan skor wawancara akhir per kandidat. Dikelola oleh Panitia Seleksi (RLS <code>interviews_manage_panitia</code>).</p>

      {canManage && (
        <form action={scheduleInterviewAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1">Seleksi</label>
            <select name="selection_id" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
              <option value="">Pilih...</option>
              {selections?.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kandidat</label>
            <select name="candidate_id" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
              <option value="">Pilih...</option>
              {candidates?.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Tanggal</label>
            <input name="tanggal" type="date" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Pewawancara</label>
            <input name="pewawancara" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
          </div>
          <button type="submit" className="col-span-4 bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Jadwalkan Wawancara</button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {interviews?.map((it: any) => (
          <div key={it.id} className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <b className="text-sm">{it.candidates?.nama}</b>
                <div className="text-[11px] text-ink-500">{it.selections?.nama} {it.tanggal && `· ${new Date(it.tanggal).toLocaleDateString("id-ID")}`} {it.pewawancara && `· ${it.pewawancara}`}</div>
              </div>
              {it.skor !== null && it.skor !== undefined && (
                <span className="text-[11px] font-bold bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full font-mono">{it.skor}</span>
              )}
            </div>

            {canManage ? (
              <form action={recordInterviewResultAction.bind(null, it.id)} className="grid grid-cols-6 gap-2 items-end">
                <div className="col-span-4">
                  <label className="block text-[11px] font-semibold mb-1">Catatan</label>
                  <textarea name="catatan" defaultValue={it.catatan ?? ""} rows={2} className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Skor (0-100)</label>
                  <input name="skor" type="number" min={0} max={100} step="0.1" defaultValue={it.skor ?? ""} className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Rekomendasi</label>
                  <input name="rekomendasi" defaultValue={it.rekomendasi ?? ""} className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs" />
                </div>
                <button type="submit" className="col-span-6 text-xs bg-navy-900 text-white font-semibold rounded-md px-3 py-1.5 justify-self-start">Simpan Hasil</button>
              </form>
            ) : (
              <>
                {it.catatan && <p className="text-xs text-ink-700">{it.catatan}</p>}
                {it.rekomendasi && <p className="text-xs text-navy-700 mt-1"><b>Rekomendasi:</b> {it.rekomendasi}</p>}
              </>
            )}
          </div>
        )) ?? <div className="text-sm text-ink-500">Belum ada wawancara dijadwalkan.</div>}
        {interviews?.length === 0 && <div className="text-sm text-ink-500">Belum ada wawancara dijadwalkan.</div>}
      </div>
    </div>
  );
}
