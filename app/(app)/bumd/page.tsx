import { createClient } from "@/lib/supabase/server";

export default async function BumdPage() {
  const supabase = createClient();
  const { data: bumds } = await supabase.from("bumds").select("*").order("nama");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Master BUMD</h1>
      <p className="text-sm text-ink-500 mb-6">Data induk badan usaha milik daerah — dibaca dari tabel <code>public.bumds</code>.</p>
      <div className="grid grid-cols-2 gap-5">
        {bumds?.map((b) => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white p-5">
              <div className="text-[10px] uppercase tracking-wide text-gold-400 font-bold">{b.bentuk_badan_hukum}</div>
              <h3 className="text-white text-lg font-display font-bold mt-1">{b.nama}</h3>
            </div>
            <div className="p-5 text-sm text-ink-700 leading-relaxed">
              {b.deskripsi}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink-500">
                <span>Bidang: <b className="text-ink-900">{b.bidang_usaha}</b></span>
                <span>Berdiri: <b className="text-ink-900">{b.tahun_berdiri}</b></span>
                <span>Status: <b className="text-ink-900">{b.status}</b></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
