"use client";

import { useTransition } from "react";
import { setAnnouncementStatusAction } from "./actions";

const TRANSITIONS: Record<string, { to: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED"; label: string; cls: string }[]> = {
  DRAFT: [{ to: "PUBLISHED", label: "Publikasikan", cls: "bg-green-700 text-white hover:bg-green-800" }],
  SCHEDULED: [
    { to: "PUBLISHED", label: "Publikasikan Sekarang", cls: "bg-green-700 text-white hover:bg-green-800" },
    { to: "DRAFT", label: "Kembali ke Draf", cls: "border border-gray-200 text-ink-700 hover:bg-gray-50" },
  ],
  PUBLISHED: [{ to: "ARCHIVED", label: "Arsipkan", cls: "border border-amber-200 text-amber-700 hover:bg-amber-50" }],
  ARCHIVED: [{ to: "DRAFT", label: "Kembali ke Draf", cls: "border border-gray-200 text-ink-700 hover:bg-gray-50" }],
};

export default function AnnouncementStatusButtons({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const options = TRANSITIONS[status] ?? [];

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.to}
          disabled={isPending}
          onClick={() => startTransition(() => { setAnnouncementStatusAction(id, opt.to); })}
          className={`text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-50 ${opt.cls}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
