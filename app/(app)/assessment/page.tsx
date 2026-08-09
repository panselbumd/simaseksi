import { createClient } from "@/lib/supabase/server";
import { CandidateScoreCard } from "./score-form";

export default async function AssessmentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  const { data: selections } = await supabase.from("selections").select("id, nama").limit(1);
  const selection = selections?.[0];

  if (!selection) {
    return <div className="text-sm text-ink-500">Tidak ada seleksi dalam cakupan Anda.</div>;
  }

  const { data: components } = await supabase
    .from("assessment_components").select("id, name, weight").eq("selection_id", selection.id).eq("active", true);
  const { data: candidates } = await supabase
    .from("candidates").select("id, nama").eq("selection_id", selection.id);

  if (profile!.role === "TIM_UKK") {
    const { data: myScores } = await supabase
      .from("assessment_scores").select("candidate_id, component_id, score, locked")
      .eq("ukk_user_id", user!.id);
    const { data: myAssessments } = await supabase
      .from("assessments").select("candidate_id, status").eq("ukk_user_id", user!.id);

    return (
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Assessment & Scoring</h1>
        <p className="text-sm text-ink-500 mb-6">
          Penilaian independen — nilai Anda tidak terlihat oleh anggota Tim UKK lain (RLS <code>scores_select_own_ukk</code>), dan
          otomatis <b>terkunci</b> setelah disubmit (trigger <code>prevent_locked_score_update</code>).
        </p>
        {candidates?.map((cand) => {
          const scores = (myScores ?? []).filter((s) => s.candidate_id === cand.id);
          const locked = myAssessments?.find((a) => a.candidate_id === cand.id)?.status === "LOCKED";
          return (
            <CandidateScoreCard
              key={cand.id} selectionId={selection.id} candidateId={cand.id} candidateName={cand.nama}
              components={components ?? []} initialScores={scores} locked={!!locked}
            />
          );
        })}
      </div>
    );
  }

  // Staff view: read-only aggregated matrix. No write policy exists for this
  // role on assessment_scores, so this page never renders inputs for them.
  const { data: allScores } = await supabase
    .from("assessment_scores").select("candidate_id, component_id, score").eq("selection_id", selection.id);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Assessment & Scoring</h1>
      <p className="text-sm text-ink-500 mb-6">Rekap penilaian per kandidat (read-only — peran Anda tidak memiliki hak UPDATE pada <code>assessment_scores</code>).</p>
      <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
              <th className="px-4 py-3">Kandidat</th>
              {components?.map((c) => <th key={c.id} className="px-4 py-3">{c.name} ({c.weight}%)</th>)}
            </tr>
          </thead>
          <tbody>
            {candidates?.map((cand) => (
              <tr key={cand.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{cand.nama}</td>
                {components?.map((c) => {
                  const rows = (allScores ?? []).filter((s) => s.candidate_id === cand.id && s.component_id === c.id && s.score !== null);
                  const avg = rows.length ? (rows.reduce((a, b) => a + (b.score ?? 0), 0) / rows.length).toFixed(1) : "-";
                  return <td key={c.id} className="px-4 py-3 font-mono">{avg}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-500 mt-3">Untuk skor akhir berbobot dan ranking otomatis, lihat halaman Ranking (dihitung oleh view <code>v_candidate_ranking</code>).</p>
    </div>
  );
}
