"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSelectionAction } from "./actions";

export default function DeleteSelectionButton({ id, nama }: { id: string; nama: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Hapus seleksi "${nama}"? Semua data terkait (kandidat, penilaian, dokumen) akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteSelectionAction(id, nama);
        router.refresh();
      } catch (e: any) {
        setError(e?.message || "Gagal menghapus seleksi.");
      }
    });
  }

  return (
    <div className="inline-block">
      <button type="button" onClick={handleDelete} disabled={pending} className="text-xs text-red-600 underline disabled:opacity-50">
        {pending ? "Menghapus..." : "Hapus"}
      </button>
      {error && <div className="text-[11px] text-red-600 mt-1 max-w-[180px]">{error}</div>}
    </div>
  );
}
