import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { findReport, toCSV } from "@/lib/reports";

// GET /reports/[key]/export.csv — exports one report as CSV. No separate
// authorization here beyond normal auth: each underlying query still goes
// through that table's own RLS, same as /ranking/export.csv.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const report = findReport(key);
  if (!report) return new NextResponse("Laporan tidak dikenali", { status: 404 });

  const rows = await report.fetch(supabase);
  const csv = toCSV(rows, report.headers);

  await supabase.rpc("write_audit_log", { p_module: "Report", p_action: "EXPORT_REPORT", p_old_value: "-", p_new_value: report.label, p_selection: "" });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="simaseksi-${key}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
