"use client";

import { deleteRegulationAction, verifyRegulationAction } from "./regulation-actions";

export default function RegulationRowActions({ id, judul, status }: { id: string; judul: string; status: string }) {
  return (
    <div className="flex items-center gap-3">
      {status !== "VERIFIED" && (
        <form
          action={() => {
            if (window.confirm(`Tandai "${judul}" sudah diverifikasi & divalidasi? Pastikan pihak berwenang benar-benar sudah mengecek isinya sebelum menekan ini.`)) {
              verifyRegulationAction(id, judul);
            }
          }}
        >
          <button type="submit" className="text-xs text-green-700 underline">Tandai Terverifikasi</button>
        </form>
      )}
      <form
        action={() => {
          if (window.confirm(`Hapus regulasi "${judul}"? Gunakan ini untuk membereskan entri duplikat. Tindakan tidak dapat dibatalkan.`)) {
            deleteRegulationAction(id, judul);
          }
        }}
      >
        <button type="submit" className="text-xs text-red-600 underline">Hapus</button>
      </form>
    </div>
  );
}
