"use client";

import { deleteAnnouncementAction } from "./actions";

export default function DeleteAnnouncementButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={() => {
        if (window.confirm(`Hapus pengumuman "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
          deleteAnnouncementAction(id);
        }
      }}
    >
      <button type="submit" className="text-xs text-red-600 underline">Hapus</button>
    </form>
  );
}
