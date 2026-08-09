// Minimal email sender using Resend's HTTP API directly (no SDK dependency
// needed — one fetch() call). Configure with:
//   RESEND_API_KEY=re_xxxxx
//   EMAIL_FROM="SIMASEKSI <no-reply@yourdomain.go.id>"
// in .env.local / Vercel project env vars.
//
// If RESEND_API_KEY is not set, sendEmail() logs a warning and no-ops
// instead of throwing — so stage-progression actions that call it never
// fail just because email isn't configured yet in a given environment.

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "SIMASEKSI <no-reply@simaseksi.batukota.go.id>";

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY belum diset — email ke ${to} ("${subject}") tidak dikirim.`);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  if (!to) {
    console.warn(`[email] Tidak ada alamat email tujuan untuk "${subject}" — dilewati.`);
    return { sent: false, reason: "missing recipient" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] Gagal mengirim ke ${to}: ${res.status} ${body}`);
    return { sent: false, reason: `Resend ${res.status}` };
  }
  return { sent: true };
}

const STAGE_LABEL: Record<string, string> = {
  VERIFICATION_PASSED: "Verifikasi Dokumen",
  UKK_PASSED: "Uji Kelayakan dan Kepatutan (UKK)",
  INTERVIEW_PASSED: "Wawancara",
  FINALIZED: "Penetapan Akhir",
};

// One shared template for every "peserta lolos tahapan X" notification —
// see the trigger points documented in each server action file
// (documents/actions.ts, decision/actions.ts, ...).
export async function sendStageProgressionEmail({
  to, nama, selectionNama, stage,
}: { to: string | null | undefined; nama: string; selectionNama: string; stage: keyof typeof STAGE_LABEL }) {
  if (!to) return { sent: false, reason: "applicant has no email on file" };
  const stageLabel = STAGE_LABEL[stage] ?? stage;
  return sendEmail({
    to,
    subject: `[SIMASEKSI] Anda Lolos Tahap ${stageLabel} — ${selectionNama}`,
    html: `
      <p>Yth. ${nama},</p>
      <p>Selamat, Anda dinyatakan <strong>lolos tahap ${stageLabel}</strong> pada proses seleksi
      <strong>${selectionNama}</strong>.</p>
      <p>Silakan masuk ke akun SIMASEKSI Anda untuk melihat informasi tahap selanjutnya.</p>
      <p>Salam,<br/>Panitia Seleksi</p>
    `,
  });
}
