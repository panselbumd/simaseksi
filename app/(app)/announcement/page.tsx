import { createClient } from "@/lib/supabase/server";
import { createAnnouncementAction, setAnnouncementStatusAction } from "./actions";
import DeleteAnnouncementButton from "./DeleteAnnouncementButton";
import AnnouncementStatusButtons from "./AnnouncementStatusButtons";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", SCHEDULED: "Terjadwal", PUBLISHED: "Dipublikasikan", ARCHIVED: "Diarsipkan",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", SCHEDULED: "bg-blue-50 text-blue-700",
  PUBLISHED: "bg-green-50 text-green-700", ARCHIVED: "bg-amber-50 text-amber-700",
};

export default async function AnnouncementPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const canManage = profile?.role === "PANITIA_SELEKSI" || profile?.role === "SYSTEM_ADMIN";

  // RLS "announcements_select_published" already scopes this correctly:
  // PANITIA/ADMIN/AUDITOR see every status, everyone else only PUBLISHED.
  const { data: anns } = await supabase.from("announcements").select("*, selections(nama)").order("publish_date", { ascending: false });

  let selections: { id: string; nama: string }[] = [];
  if (canManage) {
    const { data } = await supabase.from("selections").select("id, nama").order("tahun", { ascending: false });
    selections = data ?? [];
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Pengumuman</h1>
      <p className="text-sm text-ink-500 mb-6">
        Publikasikan informasi resmi terkait tahapan seleksi. Hanya Panitia Seleksi dan Administrator Sistem yang
        dapat membuat, mengubah status, atau menghapus pengumuman (<code>announcements_manage_panitia</code>) —
        pengunjung dan peran lain hanya melihat pengumuman berstatus <b>Dipublikasikan</b>.
      </p>

      {canManage && (
        <form action={createAnnouncementAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 flex flex-col gap-3">
          <b className="text-sm">Buat Pengumuman Baru</b>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Judul</label>
              <input name="title" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Kategori</label>
              <input name="category" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" placeholder="mis. Jadwal, Hasil, Umum" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Seleksi Terkait (opsional)</label>
              <select name="selection_id" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                <option value="">— Umum, tidak terkait seleksi tertentu —</option>
                {selections.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tanggal Publikasi</label>
              <input name="publish_date" type="date" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Isi Pengumuman</label>
              <textarea name="content" required rows={3} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
            </div>
          </div>
          <button type="submit" className="self-start bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">
            Simpan sebagai Draf
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {anns?.map((a: any) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-start gap-3 mb-1">
              <div>
                <b className="text-sm">{a.title}</b>
                {a.selections?.nama && <span className="text-[11px] text-ink-500 ml-2">· {a.selections.nama}</span>}
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_COLOR[a.status] ?? ""}`}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </div>
            {a.category && <div className="text-[11px] text-gold-700 font-semibold mb-1">{a.category}</div>}
            <p className="text-xs text-ink-500 whitespace-pre-line">{a.content}</p>
            {a.publish_date && <div className="text-[11px] text-ink-500 mt-2">Tanggal: {a.publish_date}</div>}
            {canManage && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                <AnnouncementStatusButtons id={a.id} status={a.status} />
                <DeleteAnnouncementButton id={a.id} title={a.title} />
              </div>
            )}
          </div>
        )) ?? <div className="text-sm text-ink-500">Belum ada pengumuman dipublikasikan.</div>}
        {anns?.length === 0 && <div className="text-sm text-ink-500">Belum ada pengumuman dipublikasikan.</div>}
      </div>
    </div>
  );
}
