import { createClient } from "@/lib/supabase/server";

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(50);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Audit Trail</h1>
      <p className="text-sm text-ink-500 mb-6">
        Append-only — tabel <code>audit_logs</code> tidak memiliki RLS policy UPDATE maupun DELETE sama sekali,
        dan satu-satunya jalur INSERT adalah fungsi <code>write_audit_log()</code> (SECURITY DEFINER).
      </p>
      <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
              <th className="px-4 py-3">Waktu</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Peran</th>
              <th className="px-4 py-3">Modul</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(l.timestamp).toLocaleString("id-ID")}</td>
                <td className="px-4 py-3">{l.username}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full">{l.role}</span></td>
                <td className="px-4 py-3">{l.module}</td>
                <td className="px-4 py-3">{l.action}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.old_value} → {l.new_value}</td>
              </tr>
            )) ?? <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">Belum ada aktivitas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
