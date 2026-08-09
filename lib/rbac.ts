export type AppRole =
  | "SYSTEM_ADMIN" | "PANITIA_SELEKSI" | "TIM_UKK" | "PESERTA" | "KPM" | "PEJABAT_BERWENANG" | "AUDITOR";

export const ROLE_LABEL: Record<AppRole, string> = {
  SYSTEM_ADMIN: "Administrator Sistem",
  PANITIA_SELEKSI: "Panitia Seleksi",
  TIM_UKK: "Tim Uji Kompetensi & Kelayakan",
  PESERTA: "Peserta / Kandidat",
  KPM: "KPM",
  PEJABAT_BERWENANG: "Pejabat Berwenang",
  AUDITOR: "Auditor",
};

// Peran yang boleh dibuat manual oleh Admin lewat /users. PESERTA sengaja
// dikecualikan: akun peserta hanya dibuat lewat pendaftaran mandiri di
// /daftar ketika sebuah seleksi berstatus REGISTRATION (lihat §3.6 README
// dan applicants_insert_self di schema.sql). Admin masih bisa MELIHAT/
// MENGEDIT akun peserta yang sudah ada (mis. menonaktifkan), makanya
// PESERTA tetap ada di ROLE_LABEL dan di halaman Edit — hanya disembunyikan
// dari form "Tambah User".
export const CREATABLE_ROLES: AppRole[] = (Object.keys(ROLE_LABEL) as AppRole[]).filter(
  (r) => r !== "PESERTA",
);

// Mirrors index.html's PERMISSIONS matrix 1:1 so both surfaces stay in sync.
// This is a UI/UX convenience layer only — the real authorization boundary
// is Postgres Row Level Security (see supabase/schema.sql). Never rely on
// this map alone to protect data.
export const PERMISSIONS: Record<AppRole, string[]> = {
  SYSTEM_ADMIN: [
    "dashboard.view", "bumd.view", "bumd.manage", "regulation.view", "regulation.manage",
    "sop.view", "sop.manage", "selection.view", "candidate.view", "document.view",
    "audit.view", "user.manage", "settings.view",
    // Announcements are public-relations content, not a substantive selection
    // decision, so Admin shares this write with Panitia per the DB policy
    // `announcements_manage_panitia` (role in PANITIA_SELEKSI, SYSTEM_ADMIN).
    // Admin deliberately still has NO recommendation/decision/ranking-write
    // access — see the "Admin = System Control" banner on /dashboard.
    "announcement.view", "announcement.manage",
  ],
  PANITIA_SELEKSI: [
    "dashboard.view", "bumd.view", "regulation.view", "sop.view", "selection.view", "selection.manage",
    "schedule.view", "schedule.manage", "applicant.view", "applicant.manage", "nomination.view",
    "nomination.manage", "eligibility.view", "eligibility.manage", "candidate.view", "candidate.manage",
    "document.view", "document.verify", "ukk.view", "ukk.manage", "assessment.view", "ranking.view",
    "interview.view", "interview.manage", "recommendation.view", "recommendation.manage", "decision.view",
    "announcement.view", "announcement.manage", "letter.view", "letter.manage", "report.view",
  ],
  TIM_UKK: ["dashboard.view", "ukk.view", "assessment.view", "assessment.score", "candidate.view", "schedule.view"],
  PESERTA: ["self.view", "self.manage", "dashboard.view", "announcement.view", "schedule.view", "document.view"],
  KPM: [
    "dashboard.view", "selection.view", "candidate.view", "ranking.view", "assessment.view",
    "recommendation.view", "recommendation.approve", "decision.view", "decision.manage",
    "document.view", "report.view", "announcement.view", "bumd.view",
  ],
  PEJABAT_BERWENANG: [
    "dashboard.view", "selection.view", "candidate.view", "ranking.view", "assessment.view",
    "recommendation.view", "recommendation.approve", "decision.view", "decision.manage",
    "document.view", "report.view", "announcement.view", "bumd.view",
  ],
  AUDITOR: ["dashboard.view", "audit.view", "report.view", "selection.view", "candidate.view", "assessment.view", "decision.view", "document.view"],
};

export function hasPermission(role: AppRole, perm: string): boolean {
  return PERMISSIONS[role]?.includes(perm) ?? false;
}

export const ROLE_HOME: Record<AppRole, string> = {
  SYSTEM_ADMIN: "/dashboard",
  PANITIA_SELEKSI: "/dashboard",
  TIM_UKK: "/dashboard",
  PESERTA: "/dashboard",
  KPM: "/dashboard",
  PEJABAT_BERWENANG: "/dashboard",
  AUDITOR: "/audit-log",
};
