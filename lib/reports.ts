import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportRow = Record<string, any>;
export type ReportDef = {
  key: string;
  label: string;
  headers: { label: string; get: (r: ReportRow) => string }[];
  fetch: (supabase: SupabaseClient) => Promise<ReportRow[]>;
};

const SELECTION_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", PLANNED: "Direncanakan", PUBLISHED: "Dipublikasikan", REGISTRATION: "Pendaftaran",
  VERIFICATION: "Verifikasi", UKK: "UKK", INTERVIEW: "Wawancara", FINALIZATION: "Finalisasi",
  COMPLETED: "Selesai", ARCHIVED: "Diarsipkan",
};

// Mirrors index.html's `reportDefs` 1:1 (module — REPORTING), rewired to
// Supabase queries. Row visibility is governed entirely by each table's own
// RLS policy — this file adds no extra scoping on top of that.
export const REPORT_DEFS: ReportDef[] = [
  {
    key: "seleksi", label: "Laporan Seleksi",
    headers: [
      { label: "Nama", get: (r) => r.nama },
      { label: "Jabatan", get: (r) => r.jabatan },
      { label: "Status", get: (r) => SELECTION_STATUS_LABEL[r.status] ?? r.status },
    ],
    fetch: async (supabase) =>
      (await supabase.from("selections").select("nama, jabatan, status").order("created_at", { ascending: false })).data ?? [],
  },
  {
    key: "peserta", label: "Laporan Peserta",
    headers: [
      { label: "Nama", get: (r) => r.nama },
      { label: "Status", get: (r) => r.status },
      { label: "Pendidikan", get: (r) => r.pendidikan_terakhir },
    ],
    fetch: async (supabase) =>
      (await supabase.from("applicants").select("nama, status, pendidikan_terakhir").order("submitted_at", { ascending: false })).data ?? [],
  },
  {
    key: "nominasi", label: "Laporan Nominasi Internal",
    headers: [
      { label: "Nama", get: (r) => r.nama },
      { label: "Unit Kerja", get: (r) => r.unit_kerja },
      { label: "Status", get: (r) => r.status_nominasi },
    ],
    fetch: async (supabase) =>
      (await supabase.from("internal_nominations").select("nama, unit_kerja, status_nominasi")).data ?? [],
  },
  {
    key: "dokumen", label: "Laporan Verifikasi Dokumen",
    headers: [
      { label: "Jenis", get: (r) => r.jenis },
      { label: "Status", get: (r) => r.status },
      { label: "Tanggal", get: (r) => (r.tanggal ? new Date(r.tanggal).toLocaleDateString("id-ID") : "-") },
    ],
    fetch: async (supabase) => (await supabase.from("documents").select("jenis, status, tanggal")).data ?? [],
  },
  {
    key: "nilai", label: "Laporan Nilai UKK",
    headers: [
      { label: "Kandidat", get: (r) => r.nama },
      { label: "Final Score", get: (r) => (r.final_score != null ? Number(r.final_score).toFixed(2) : "-") },
      { label: "Peringkat", get: (r) => r.ranking ?? "-" },
    ],
    fetch: async (supabase) =>
      (await supabase.from("v_candidate_ranking").select("nama, final_score, ranking").order("ranking", { ascending: true })).data ?? [],
  },
  {
    key: "audit", label: "Laporan Audit",
    headers: [
      { label: "Waktu", get: (r) => new Date(r.timestamp).toLocaleString("id-ID") },
      { label: "User", get: (r) => r.username },
      { label: "Aksi", get: (r) => r.action },
    ],
    fetch: async (supabase) =>
      (await supabase.from("audit_logs").select("timestamp, username, action").order("timestamp", { ascending: false }).limit(500)).data ?? [],
  },
];

export function findReport(key: string): ReportDef | undefined {
  return REPORT_DEFS.find((r) => r.key === key);
}

export function toCSV(rows: ReportRow[], headers: ReportDef["headers"]): string {
  const head = headers.map((h) => `"${h.label}"`).join(",") + "\n";
  const body = rows.map((r) => headers.map((h) => `"${String(h.get(r) ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  return head + body;
}
