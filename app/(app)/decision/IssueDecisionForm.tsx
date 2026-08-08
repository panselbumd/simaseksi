"use client";

import { useState } from "react";
import { issueDecisionAction } from "./actions";

type EligibleRec = { id: string; selection_id: string; ringkasan: string | null; selections: { nama: string } | null };

export function IssueDecisionForm({ eligible }: { eligible: EligibleRec[] }) {
  const [recommendationId, setRecommendationId] = useState("");
  const selectionId = eligible.find((r) => r.id === recommendationId)?.selection_id ?? "";

  return (
    <form action={issueDecisionAction} className="bg-white border border-gray-200 rounded-md p-5 mb-6 flex flex-col gap-3">
      <b className="text-sm">Terbitkan Keputusan Baru</b>
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-[2] min-w-[240px]">
          <label className="block text-xs font-semibold mb-1">Rekomendasi Final Rujukan</label>
          <select
            name="recommendation_id" required value={recommendationId}
            onChange={(e) => setRecommendationId(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm"
          >
            <option value="">Pilih rekomendasi final...</option>
            {eligible.map((r) => (
              <option key={r.id} value={r.id}>
                {r.selections?.nama} — {r.ringkasan ? r.ringkasan.slice(0, 60) : "(tanpa ringkasan)"}
              </option>
            ))}
          </select>
          <input type="hidden" name="selection_id" value={selectionId} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Nomor SK</label>
          <input name="nomor" required className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" placeholder="mis. 188/45/KEP/2026" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Tanggal</label>
          <input name="tanggal" type="date" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <button type="submit" disabled={!recommendationId} className="bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-40">
          Terbitkan
        </button>
      </div>
    </form>
  );
}
