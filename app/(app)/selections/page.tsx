import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { hasPermission, type AppRole } from "@/lib/rbac";
import DeleteSelectionButton from "./DeleteSelectionButton";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", PLANNED: "Direncanakan", PUBLISHED: "Dipublikasikan", REGISTRATION: "Pendaftaran",
  VERIFICATION: "Verifikasi", UKK: "UKK", INTERVIEW: "Wawancara", FINALIZATION: "Finalisasi",
  COMPLETED: "Selesai", ARCHIVED: "Diarsipkan",
};

export default async function SelectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role as AppRole;
  const canManage = hasPermission(role, "selection.manage");

  const { data: selections } = await supabase
    .from("selections")
    .select("id, nama, jabatan, tahun, selection_type, status, bumds(nama)")
    .order("tahun", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-display font-bold text-navy-900">Manajemen Seleksi</h1>
        {canManage && (
          <Link href="/selections/new" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2 whitespace-nowrap">
            + Tambah Seleksi
          </Link>
        )}
      </div>
      <p className="text-sm text-ink-500 mb-6">Hanya seleksi yang berada dalam cakupan (scope) peran Anda yang tampil di sini — ditentukan oleh RLS pada tabel <code>selections</code> &amp; <code>selection_members</code>.</p>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
              <th className="px-4 py-3">Nama Seleksi</th>
              <th className="px-4 py-3">BUMD</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {selections?.map((s: any) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{s.nama}</td>
                <td className="px-4 py-3">{s.bumds?.nama}</td>
                <td className="px-4 py-3">{s.jabatan}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${s.selection_type === "OPEN_SELECTION" ? "bg-gold-100 text-gold-700" : "bg-blue-50 text-blue-700"}`}>
                    {s.selection_type === "OPEN_SELECTION" ? "OPEN" : "INTERNAL"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] bg-navy-50 text-navy-800 px-2 py-0.5 rounded-full">{STATUS_LABEL[s.status] ?? s.status}</span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <Link href={`/selections/${s.id}/edit`} className="text-navy-700 underline">Edit</Link>
                      <Link href={`/selections/${s.id}/surat`} className="text-navy-700 underline">Cetak/Unduh Surat</Link>
                      <DeleteSelectionButton id={s.id} nama={s.nama} />
                    </div>
                  </td>
                )}
              </tr>
            )) ?? (
              <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-ink-500">Tidak ada seleksi dalam cakupan Anda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
