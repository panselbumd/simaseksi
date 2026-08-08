"use client";

import { useFormState, useFormStatus } from "react-dom";
import { registerAction, type RegisterState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-navy-900 text-white font-semibold text-sm py-2.5 hover:bg-navy-800 disabled:opacity-60"
    >
      {pending ? "Mendaftarkan..." : "Daftar Sekarang"}
    </button>
  );
}

export default function RegisterForm({ selectionId }: { selectionId: string }) {
  const boundAction = registerAction.bind(null, selectionId);
  const [state, formAction] = useFormState<RegisterState, FormData>(boundAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Nama Lengkap</label>
          <input name="nama" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Username</label>
          <input name="username" required pattern="[a-z0-9._-]{4,32}" title="4-32 karakter huruf kecil/angka/./_/-" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" placeholder="mis. budi.santoso" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Password</label>
          <input name="password" type="password" required minLength={8} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" placeholder="Minimal 8 karakter" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Email</label>
          <input name="email" type="email" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Telepon</label>
          <input name="telepon" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Tempat Lahir</label>
          <input name="tempat_lahir" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Tanggal Lahir</label>
          <input name="tanggal_lahir" type="date" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Pendidikan Terakhir</label>
          <input name="pendidikan_terakhir" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" placeholder="mis. S2 Manajemen" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Pengalaman (tahun)</label>
          <input name="pengalaman_tahun" type="number" min={0} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">Jabatan Terakhir</label>
          <input name="jabatan_terakhir" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </div>
      </div>

      {state?.error && (
        <div className="bg-red-50 text-red-700 text-xs rounded-md px-3 py-2">{state.error}</div>
      )}

      <SubmitButton />
      <p className="text-[11px] text-ink-500 text-center">
        Dengan mendaftar, Anda akan memiliki akun Peserta untuk memantau status pendaftaran ini.
      </p>
    </form>
  );
}
