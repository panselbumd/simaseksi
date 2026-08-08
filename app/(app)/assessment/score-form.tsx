"use client";

import { useState, useTransition } from "react";
import { saveScoreAction, submitAssessmentAction } from "./actions";

type Component = { id: string; name: string; weight: number };
type ScoreRow = { component_id: string; score: number | null; locked: boolean };

export function CandidateScoreCard({
  selectionId, candidateId, candidateName, components, initialScores, locked,
}: {
  selectionId: string; candidateId: string; candidateName: string;
  components: Component[]; initialScores: ScoreRow[]; locked: boolean;
}) {
  const [values, setValues] = useState<Record<string, number | "">>(
    Object.fromEntries(components.map((c) => [c.id, initialScores.find((s) => s.component_id === c.id)?.score ?? ""]))
  );
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const complete = components.every((c) => values[c.id] !== "" && values[c.id] !== undefined);

  function updateScore(componentId: string, raw: string) {
    const val = raw === "" ? "" : Math.max(0, Math.min(100, Number(raw)));
    setValues((v) => ({ ...v, [componentId]: val }));
    if (val !== "") {
      startTransition(() => {
        saveScoreAction({ selectionId, candidateId, componentId, score: val as number }).catch((e) => setErr(e.message));
      });
    }
  }

  function submit() {
    setErr(null);
    startTransition(() => {
      submitAssessmentAction(selectionId, candidateId).catch((e) => setErr(e.message));
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <b className="text-sm">{candidateName}</b>
        {locked
          ? <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">🔒 Terkunci</span>
          : <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Belum Disubmit</span>}
      </div>
      <div className="flex flex-col gap-2.5">
        {components.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="text-sm flex-1">{c.name} <span className="text-ink-500 text-xs">(bobot {c.weight}%)</span></span>
            <input
              type="number" min={0} max={100} disabled={locked}
              value={values[c.id]}
              onChange={(e) => updateScore(c.id, e.target.value)}
              className="w-24 border border-gray-200 rounded-md px-2 py-1.5 text-sm disabled:bg-gray-50"
            />
          </div>
        ))}
      </div>
      {err && <div className="text-xs text-red-600 mt-2">{err}</div>}
      {!locked && (
        <button
          onClick={submit} disabled={!complete || isPending}
          className="mt-4 bg-navy-900 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-40"
        >
          {isPending ? "Menyimpan..." : "🔒 Submit & Kunci Penilaian"}
        </button>
      )}
    </div>
  );
}
