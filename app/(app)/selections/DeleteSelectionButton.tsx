"use client";

import { deleteSelectionAction } from "./actions";

export default function DeleteSelectionButton({ id, nama }: { id: string; nama: string }) {
  return (
    <form
      action={() => {
        if (window.confirm(`Hapus seleksi "${nama}"? Semua data terkait (kandidat, penilaian, dokumen) akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`)) {
          deleteSelectionAction(id, nama);
        }
      }}
    >
      <button type="submit" className="text-xs text-red-600 underline">Hapus</button>
    </form>
  );
}
