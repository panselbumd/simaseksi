/**
 * SIMASEKSI — Demo auth users + dependent seed rows.
 *
 * Run AFTER `schema.sql` and `seed.sql` have been applied to your Supabase
 * project, and AFTER `npm install`.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/seed-auth-users.ts
 *
 * (Reads the same variables as .env.local — export them or use `dotenv -e .env.local -- npx tsx ...`.)
 *
 * Creates one auth.users row per demo account (with a synthetic
 * username@simaseksi.local email, per lib/supabase — see get_login_email()
 * in schema.sql), a matching public.profiles row, and a small amount of
 * dependent demo data (one applicant + candidate + a few locked scores) so
 * the Ranking and Assessment screens have something to show immediately.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DEMO_USERS = [
  { username: "admin", password: "admin123", name: "Rahmat Hidayat", role: "SYSTEM_ADMIN", unit: "Bagian Perekonomian dan SDA" },
  { username: "pansel", password: "pansel123", name: "Dra. Herlina Wijayanti, M.Si.", role: "PANITIA_SELEKSI", unit: "Sekretariat Panitia Seleksi" },
  { username: "ukk01", password: "ukk123", name: "Dr. Bagas Setiawan, M.M.", role: "TIM_UKK", unit: "Tim UKK - Unsur Akademisi" },
  { username: "ukk02", password: "ukk123", name: "Ir. Wulan Kartika, M.T.", role: "TIM_UKK", unit: "Tim UKK - Unsur Profesional" },
  { username: "peserta01", password: "peserta123", name: "Ahmad Prasetyo Wibowo", role: "PESERTA", unit: "-" },
  { username: "kpm", password: "kpm123", name: "H. Suryo Aditomo, S.H., M.H.", role: "KPM", unit: "KPM Kota Batu" },
  { username: "auditor", password: "auditor123", name: "Ganjar Wicaksono", role: "AUDITOR", unit: "Inspektorat Kota Batu" },
] as const;

const SELECTION_ID = "33333333-3333-3333-3333-333333333333"; // Seleksi Calon Direksi Perumdam Among Tirto

async function main() {
  const ids: Record<string, string> = {};

  for (const u of DEMO_USERS) {
    const email = `${u.username}@simaseksi.local`;
    const { data, error } = await admin.auth.admin.createUser({
      email, password: u.password, email_confirm: true,
    });
    if (error && !error.message.includes("already registered")) throw error;
    const userId = data?.user?.id ?? (await admin.auth.admin.listUsers()).data.users.find(x => x.email === email)?.id;
    if (!userId) throw new Error(`Could not resolve auth user id for ${u.username}`);
    ids[u.username] = userId;

    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId, username: u.username, name: u.name, role: u.role, unit: u.unit, active: true,
    });
    if (profileErr) throw profileErr;
    console.log(`✓ ${u.username} (${u.role}) -> ${userId}`);
  }

  // Assign panitia + tim UKK to the demo Direksi selection
  await admin.from("selection_members").upsert([
    { selection_id: SELECTION_ID, user_id: ids["pansel"], member_role: "PANITIA_SELEKSI" },
    { selection_id: SELECTION_ID, user_id: ids["ukk01"], member_role: "TIM_UKK" },
    { selection_id: SELECTION_ID, user_id: ids["ukk02"], member_role: "TIM_UKK" },
    { selection_id: SELECTION_ID, user_id: ids["kpm"], member_role: "KPM" },
  ], { onConflict: "selection_id,user_id,member_role" });

  // One applicant -> candidate for peserta01
  const { data: applicant } = await admin.from("applicants").upsert({
    selection_id: SELECTION_ID, user_id: ids["peserta01"], nama: "Ahmad Prasetyo Wibowo",
    nik_dummy: "3579010001XXXXX", pendidikan_terakhir: "S2 Manajemen", pengalaman_tahun: 12,
    jabatan_terakhir: "Manajer Operasional", email: "peserta01@mailinator.com", telepon: "081000000001",
    status: "CANDIDATE",
  }).select().single();

  if (applicant) {
    const { data: candidate } = await admin.from("candidates").upsert({
      selection_id: SELECTION_ID, source_type: "APPLICANT", source_id: applicant.id,
      user_id: ids["peserta01"], nama: applicant.nama, status: "ACTIVE",
    }).select().single();

    if (candidate) {
      const { data: components } = await admin.from("assessment_components").select("id").eq("selection_id", SELECTION_ID);
      for (const ukkUsername of ["ukk01", "ukk02"]) {
        for (const comp of components ?? []) {
          await admin.from("assessment_scores").upsert({
            selection_id: SELECTION_ID, candidate_id: candidate.id, component_id: comp.id,
            ukk_user_id: ids[ukkUsername], score: 78 + Math.floor(Math.random() * 15),
            locked: true, submitted_at: new Date().toISOString(),
          }, { onConflict: "candidate_id,component_id,ukk_user_id" });
        }
        await admin.from("assessments").upsert({
          selection_id: SELECTION_ID, candidate_id: candidate.id, ukk_user_id: ids[ukkUsername], status: "LOCKED",
        }, { onConflict: "selection_id,candidate_id,ukk_user_id" });
      }
      console.log(`✓ Seeded locked assessment scores for candidate ${candidate.nama}`);
    }
  }

  console.log("\nSelesai. Login dengan salah satu akun demo di atas (password sesuai tabel README).");
}

main().catch((e) => { console.error(e); process.exit(1); });
