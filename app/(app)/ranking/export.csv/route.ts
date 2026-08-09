import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /ranking/export.csv — exports the current ranking view as CSV.
// No separate authorization here beyond normal auth: the query below still
// goes through the same RLS as the ranking page (SELECT on
// v_candidate_ranking is readable by any authenticated staff role).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: ranking } = await supabase.from("v_candidate_ranking").select("*").order("ranking", { ascending: true });

  const header = "Ranking,Kandidat,Final Score,Lengkap\n";
  const rows = (ranking ?? []).map((r: any) =>
    [r.ranking, `"${(r.nama ?? "").replace(/"/g, '""')}"`, r.final_score ?? "", r.complete ? "Ya" : "Tidak"].join(",")
  ).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ranking-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
