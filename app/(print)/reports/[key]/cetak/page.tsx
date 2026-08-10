import { createClient } from "@/lib/supabase/server";
import { findReport } from "@/lib/reports";
import PrintButton from "@/components/PrintButton";

export default async function ReportPrintPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = await createClient();
  const report = findReport(key);
  if (!report) return <div className="p-8">Laporan tidak dikenali.</div>;

  const rows = await report.fetch(supabase);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 1.5cm 2cm 2cm 2.5cm; }
        .naskah { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; }
        .naskah table { width: 100%; border-collapse: collapse; }
        .naskah th, .naskah td { border: 0.75pt solid #333; padding: 4px 8px; text-align: left; font-size: 10.5pt; }
        .naskah th { background: #eee; }
        @media print { .no-print { display: none !important; } body { margin: 0; } }
      `}</style>
      <div className="no-print p-4 bg-navy-900 text-white flex items-center justify-between">
        <div className="text-sm">Pratinjau cetak — {report.label}</div>
        <PrintButton />
      </div>
      <div className="naskah" style={{ maxWidth: "21cm", margin: "0 auto", padding: "1.5cm 2cm 2cm 2.5cm" }}>
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>PEMERINTAH KOTA BATU</h2>
        <p style={{ textAlign: "center", marginBottom: 20 }}>{report.label}</p>
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}>No</th>
              {report.headers.map((h) => <th key={h.label}>{h.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {report.headers.map((h) => <td key={h.label}>{h.get(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
