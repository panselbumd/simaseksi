import { createClient } from "@/lib/supabase/server";
import { createAnnouncementAction, updateAnnouncementAction, setAnnouncementStatusAction, deleteAnnouncementAction } from "./actions";
import { hasPermission, type AppRole } from "@/lib/rbac";

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draf", SCHEDULED: "Terjadwal", PUBLISHED: "Dipublikasikan", ARCHIVED: "Diarsipkan" };
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", SCHEDULED: "bg-blue-50 text-blue-700",
  PUBLISHED: "bg-green-50 text-green-700", ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function AnnouncementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role as AppRole;
  const canManage = hasPermission(role, "announcement.manage");

  // RLS (announcements_select_published) already scopes this: staff see
  // everything, everyone else only sees status = 'PUBLISHED'.
  const { data: anns } = await supabase.from("announcements").select("*, selections(nama)").order("publish_date", { ascending: false });
  const { data: selections } = await supabase.from("selections").select("id, nama");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Pengumuman</h1>
      <p className="text-sm text-ink-500 mb-6">Publikasikan informasi resmi terkait tahapan seleksi.</p>

      {canManage && (
        <form action={createAnnouncementAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Judul</label>
              <input name="title" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Kategori</label>
              <input name="category" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" placeholder="mis. Pendaftaran" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Tanggal Publikasi</label>
              <input name="publish_date" type="date" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold mb-1">Terkait Seleksi</label>
              <select name="selection_id" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                <option value="">Umum (tidak terkait seleksi tertentu)</option>
                {selections?.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Status Awal</label>
              <select name="status" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                <option value="DRAFT">Draf</option>
                <option value="PUBLISHED">Langsung Publikasikan</option>
              </select>
            </div>
            <div className="col-span-4">
              <label className="block text-xs font-semibold mb-1">Isi Pengumuman</label>
              <textarea name="content" required rows={3} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
            </div>
          </div>
          <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Simpan Pengumuman</button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {anns?.map((a: any) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-1">
              <div>
                <b className="text-sm">{a.title}</b>
                {a.selections?.nama && <span className="text-[11px] text-ink-500 ml-2">· {a.selections.nama}</span>}
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[a.status]}`}>{STATUS_LABEL[a.status]}</span>
            </div>
            <p className="text-xs text-ink-500 mb-1">{a.content}</p>
            {a.publish_date && <div className="text-[11px] text-ink-400">{new Date(a.publish_date).toLocaleDateString("id-ID")}</div>}

            {canManage && (
              <div className="flex gap-2 mt-3 items-center">
                <details className="group">
                  <summary className="text-xs border border-navy-200 text-navy-700 font-semibold rounded-md px-3 py-1.5 cursor-pointer list-none inline-block select-none">
                    Edit
                  </summary>
                  <form action={updateAnnouncementAction.bind(null, a.id)} className="mt-3 grid grid-cols-4 gap-3 bg-navy-50 border border-navy-100 rounded-md p-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold mb-1">Judul</label>
                      <input name="title" defaultValue={a.title} required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Kategori</label>
                      <input name="category" defaultValue={a.category || ""} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Tanggal Publikasi</label>
                      <input name="publish_date" type="date" defaultValue={a.publish_date || ""} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold mb-1">Terkait Seleksi</label>
                      <select name="selection_id" defaultValue={a.selection_id || ""} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white">
                        <option value="">Umum (tidak terkait seleksi tertentu)</option>
                        {selections?.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Status</label>
                      <select name="status" defaultValue={a.status} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white">
                        <option value="DRAFT">Draf</option>
                        <option value="SCHEDULED">Terjadwal</option>
                        <option value="PUBLISHED">Dipublikasikan</option>
                        <option value="ARCHIVED">Diarsipkan</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-semibold mb-1">Isi Pengumuman</label>
                      <textarea name="content" defaultValue={a.content} required rows={3} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm bg-white" />
                    </div>
                    <div className="col-span-4">
                      <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Simpan Perubahan</button>
                    </div>
                  </form>
                </details>
                {a.status !== "PUBLISHED" && (
                  <form action={setAnnouncementStatusAction.bind(null, a.id, "PUBLISHED")}>
                    <button className="text-xs bg-green-600 text-white font-semibold rounded-md px-3 py-1.5">Publikasikan</button>
                  </form>
                )}
                {a.status === "PUBLISHED" && (
                  <form action={setAnnouncementStatusAction.bind(null, a.id, "ARCHIVED")}>
                    <button className="text-xs bg-gray-500 text-white font-semibold rounded-md px-3 py-1.5">Arsipkan</button>
                  </form>
                )}
                <form action={deleteAnnouncementAction.bind(null, a.id)}>
                  <button className="text-xs text-red-600 underline">Hapus</button>
                </form>
              </div>
            )}
          </div>
        )) ?? <div className="text-sm text-ink-500">Belum ada pengumuman dipublikasikan.</div>}
        {anns?.length === 0 && <div className="text-sm text-ink-500">Belum ada pengumuman dipublikasikan.</div>}
      </div>
    </div>
  );
}
