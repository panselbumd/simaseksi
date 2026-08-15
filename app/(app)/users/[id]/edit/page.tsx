import { createClient } from "@/lib/supabase/server";
import { updateUserAction } from "../../actions";
import { ROLE_LABEL, type AppRole } from "@/lib/rbac";
import { notFound } from "next/navigation";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!user) notFound();

  const boundAction = updateUserAction.bind(null, user.id);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Edit User</h1>
      <p className="text-sm text-ink-500 mb-6">
        Username <span className="font-mono">{user.username}</span> tidak dapat diubah (terikat ke akun login). Kosongkan Password Baru bila tidak ingin mereset password.
      </p>

      <form action={boundAction} className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Nama</label>
          <input name="name" defaultValue={user.name} required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Peran</label>
          <select name="role" defaultValue={user.role} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            {Object.keys(ROLE_LABEL).map((r) => <option key={r} value={r}>{ROLE_LABEL[r as AppRole]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Unit Kerja</label>
          <input name="unit" defaultValue={user.unit ?? ""} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">NIP (untuk PNS)</label>
          <input name="nip" defaultValue={user.nip ?? ""} placeholder="Kosongkan jika non-PNS" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Jabatan dalam Tim</label>
          <select name="jabatan_tim" defaultValue={user.jabatan_tim ?? ""} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            <option value="">— (khusus Panitia Seleksi) —</option>
            <option value="KETUA">Ketua</option>
            <option value="SEKRETARIS">Sekretaris</option>
            <option value="ANGGOTA">Anggota</option>
          </select>
          <p className="text-xs text-ink-500 mt-1">Wajib dipilih untuk akun Panitia Seleksi — dipakai menarik Nama &amp; NIP otomatis ke tanda tangan naskah dinas. Mengubah ini juga memperbarui posisi orang tsb pada seluruh seleksi yang sedang ia ikuti.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Password Baru (opsional)</label>
          <input name="password" type="password" placeholder="Kosongkan bila tidak diubah" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2">Simpan Perubahan</button>
          <a href="/users" className="text-sm text-ink-500 px-4 py-2">Batal</a>
        </div>
      </form>
    </div>
  );
}
