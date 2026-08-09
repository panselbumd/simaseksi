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

// Mirrors index.html's PERMISSIONS matrix 1:1 so both surfaces stay in sync.
// This is a UI/UX convenience layer only — the real authorization boundary
// is Postgres Row Level Security (see supabase/schema.sql). Never rely on
// this map alone to protect data.
export const PERMISSIONS: Record<AppRole, string[]> = {
  // Admin's ONLY write permissions are user.manage (accounts) and
  // regulation.manage (regulasi may also be added by Panitia — see
  // PANITIA_SELEKSI below). Every other module is view-only for Admin,
  // per the "Admin = System Control, not System Authority" rule: Admin
  // helps other accounts with access problems but never touches
  // selection/candidate/assessment/recommendation/decision data.
  SYSTEM_ADMIN: [
    "dashboard.view", "bumd.view", "regulation.view", "regulation.manage",
    "sop.view", "selection.view", "candidate.view", "document.view",
    "audit.view", "user.manage", "settings.view", "announcement.view",
  ],
  PANITIA_SELEKSI: [
    "dashboard.view", "bumd.view", "regulation.view", "regulation.manage", "sop.view", "selection.view", "selection.manage",
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
