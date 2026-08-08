import { createClient } from "@/lib/supabase/server";

export default async function AnnouncementPage() {
  const supabase = createClient();
  const { data: anns } = await supabase.from("announcements").select("*").order("publish_date", { ascending: false });
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Pengumuman</h1>
      <p className="text-sm text-ink-500 mb-6">Publikasikan informasi resmi terkait tahapan seleksi.</p>
      <div className="flex flex-col gap-3">
        {anns?.map((a) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-1">
              <b className="text-sm">{a.title}</b>
              <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{a.status}</span>
            </div>
            <p className="text-xs text-ink-500">{a.content}</p>
          </div>
        )) ?? <div className="text-sm text-ink-500">Belum ada pengumuman dipublikasikan.</div>}
      </div>
    </div>
  );
}
