import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createUserAction, toggleUserActiveAction } from "./actions";
import { ROLE_LABEL, CREATABLE_ROLES, type AppRole } from "@/lib/rbac";
import DeleteUserButton from "./DeleteUserButton";

const EXPECTED: Record<string, number> = { SYSTEM_ADMIN: 1, PANITIA_SELEKSI: 2, TIM_UKK: 5 };

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at");

  const counts: Record<string, number> = {};
  for (const u of users ?? []) counts[u.role] = (counts[u.role] ?? 0) + 1;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Manajemen User</h1>
      <p className="text-sm text-ink-500 mb-4">Administrator hanya mengelola akses teknis — tidak memiliki kewenangan substantif atas nilai atau keputusan seleksi.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(EXPECTED).map(([role, expected]) => {
          const actual = counts[role] ?? 0;
          const ok = actual === expected;
          return (
            <span key={role} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              {ROLE_LABEL[role as AppRole]}: {actual}/{expected} {ok ? "✓" : "⚠"}
            </span>
          );
        })}
      </div>

      <form action={createUserAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 grid grid-cols-5 gap-3 items-end">
        <div><label className="block text-xs font-semibold mb-1">Nama</label><input name="name" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold mb-1">Username</label><input name="username" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold mb-1">Peran</label>
          <select name="role" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            {CREATABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <p className="text-[11px] text-ink-500 mt-1">Akun Peserta tidak dibuat di sini — peserta mendaftar mandiri lewat /daftar saat seleksi dibuka.</p>
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
                  <div className="flex items-center gap-3">
                    <Link href={`/users/${u.id}/edit`} className="text-xs text-navy-700 underline">Edit</Link>
                    <form action={toggleUserActiveAction.bind(null, u.id, !u.active)}>
                      <button className="text-xs text-navy-700 underline">{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                    </form>
                    <DeleteUserButton userId={u.id} username={u.username} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
