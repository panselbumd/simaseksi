import { createClient } from "@/lib/supabase/server";
import { createUserAction, toggleUserActiveAction } from "./actions";
import { ROLE_LABEL, type AppRole } from "@/lib/rbac";

export default async function UsersPage() {
  const supabase = createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Manajemen User</h1>
      <p className="text-sm text-ink-500 mb-6">Administrator hanya mengelola akses teknis — tidak memiliki kewenangan substantif atas nilai atau keputusan seleksi.</p>

      <form action={createUserAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 grid grid-cols-5 gap-3 items-end">
        <div><label className="block text-xs font-semibold mb-1">Nama</label><input name="name" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold mb-1">Username</label><input name="username" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold mb-1">Peran</label>
          <select name="role" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            {Object.keys(ROLE_LABEL).map((r) => <option key={r} value={r}>{ROLE_LABEL[r as AppRole]}</option>)}
          </select>
        </div>
        <div><label className="block text-xs font-semibold mb-1">Unit Kerja</label><input name="unit" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" /></div>
        <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Tambah User</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
            <th className="px-4 py-3">Nama</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Peran</th>
            <th className="px-4 py-3">Unit</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3"><span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{ROLE_LABEL[u.role as AppRole]}</span></td>
                <td className="px-4 py-3">{u.unit}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${u.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{u.active ? "Aktif" : "Nonaktif"}</span>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleUserActiveAction.bind(null, u.id, !u.active)}>
                    <button className="text-xs text-navy-700 underline">{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
