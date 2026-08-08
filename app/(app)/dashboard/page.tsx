import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type AppRole } from "@/lib/rbac";

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-500" />
      <div className="text-[11px] uppercase tracking-wide text-ink-500 font-semibold">{label}</div>
      <div className="font-display text-2xl font-bold text-navy-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const role = profile!.role as AppRole;

  const { data: selections } = await supabase.from("selections").select("id, nama, status");
  const { count: candidateCount } = await supabase.from("candidates").select("*", { count: "exact", head: true });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy-900">Dashboard {ROLE_LABEL[role]}</h1>
        <p className="text-sm text-ink-500 mt-1">Data ini dibaca langsung dari Supabase PostgreSQL dengan Row Level Security aktif — cakupan otomatis mengikuti peran Anda.</p>
      </div>

      {role === "SYSTEM_ADMIN" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md px-4 py-3 mb-6">
          <b className="block mb-0.5">Prinsip Admin = System Control</b>
          Administrator sistem tidak memiliki kewenangan untuk mengubah nilai UKK, ranking, rekomendasi, atau keputusan seleksi — RLS pada tabel <code>assessment_scores</code> dan <code>decisions</code> tidak memberi hak UPDATE apa pun kepada peran ini.
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Seleksi" value={selections?.length ?? 0} />
        <StatCard label="Seleksi Berjalan" value={selections?.filter((s) => !["COMPLETED", "ARCHIVED"].includes(s.status)).length ?? 0} />
        <StatCard label="Total Kandidat" value={candidateCount ?? 0} />
        <StatCard label="Peran Anda" value={ROLE_LABEL[role]} />
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-5">
        <h4 className="font-semibold text-sm text-navy-900 mb-3">Seleksi yang Terlihat oleh Anda</h4>
        <div className="flex flex-col gap-2">
          {selections?.length ? selections.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
              <span>{s.nama}</span>
              <span className="text-xs bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full">{s.status}</span>
            </div>
          )) : <div className="text-sm text-ink-500">Belum ada seleksi yang terlihat oleh peran Anda.</div>}
        </div>
      </div>
    </div>
  );
}
