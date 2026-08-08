"use client";

import { useState, useTransition } from "react";
import {
  updateRingkasanAction, submitForReviewAction, decideRecommendationAction, finalizeRecommendationAction,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", REVIEW: "Review", REVISION: "Revisi", APPROVED: "Disetujui", FINAL: "Final",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700", REVIEW: "bg-amber-50 text-amber-700",
  REVISION: "bg-red-50 text-red-700", APPROVED: "bg-blue-50 text-blue-700", FINAL: "bg-green-50 text-green-700",
};

export function RecommendationCard({
  id, selectionId, selectionName, status, ringkasan, canEditDraft, canReview,
}: {
  id: string; selectionId: string; selectionName: string; status: string; ringkasan: string | null;
  canEditDraft: boolean; canReview: boolean;
}) {
  const [text, setText] = useState(ringkasan ?? "");
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const editable = canEditDraft && (status === "DRAFT" || status === "REVISION");

  function run(fn: () => Promise<void>) {
    setErr(null);
    startTransition(() => { fn().catch((e) => setErr(e.message)); });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 mb-4">
      <div className="flex items-center justify-between mb-2">
        <b className="text-sm">{selectionName}</b>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[status] ?? ""}`}>{STATUS_LABEL[status] ?? status}</span>
      </div>

      {editable ? (
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="Tulis ringkasan rekomendasi..."
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mb-3"
        />
      ) : (
        <p className="text-sm text-ink-700 mb-3">{ringkasan || <span className="text-ink-500 italic">Belum ada ringkasan.</span>}</p>
      )}

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}

      <div className="flex gap-2 flex-wrap">
        {editable && (
          <button
            disabled={isPending}
            onClick={() => run(() => updateRingkasanAction(id, selectionId, (() => { const fd = new FormData(); fd.set("ringkasan", text); return fd; })()))}
            className="text-xs font-semibold text-navy-700 border border-navy-100 bg-navy-50 rounded-md px-3 py-1.5 hover:bg-navy-100 disabled:opacity-50"
          >
            Simpan Ringkasan
          </button>
        )}
        {canEditDraft && (status === "DRAFT" || status === "REVISION") && (
          <button
            disabled={isPending || !text.trim()}
            onClick={() => run(() => submitForReviewAction(id, selectionId))}
            className="text-xs font-semibold text-white bg-navy-900 rounded-md px-3 py-1.5 hover:bg-navy-800 disabled:opacity-40"
          >
            Ajukan untuk Review →
          </button>
        )}
        {canReview && status === "REVIEW" && (
          <>
            <button
              disabled={isPending}
              onClick={() => run(() => decideRecommendationAction(id, selectionId, "APPROVED"))}
              className="text-xs font-semibold text-white bg-green-700 rounded-md px-3 py-1.5 hover:bg-green-800 disabled:opacity-50"
            >
              ✓ Setujui
            </button>
            <button
              disabled={isPending}
              onClick={() => run(() => decideRecommendationAction(id, selectionId, "REVISION"))}
              className="text-xs font-semibold text-red-700 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
            >
              Kembalikan untuk Revisi
            </button>
          </>
        )}
        {canReview && status === "APPROVED" && (
          <button
            disabled={isPending}
            onClick={() => run(() => finalizeRecommendationAction(id, selectionId))}
            className="text-xs font-semibold text-white bg-gold-500 rounded-md px-3 py-1.5 hover:bg-gold-400 disabled:opacity-50"
          >
            🏁 Finalisasi
          </button>
        )}
        {status === "FINAL" && (
          <span className="text-xs text-ink-500 italic self-center">Rekomendasi final — siap dirujuk oleh Keputusan.</span>
        )}
      </div>
    </div>
  );
}
