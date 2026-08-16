// Kode Peserta format-by-sistem: {inisial jabatan}-{inisial BUMD}-{tahun}-{urut}
// mis. "DU-PAT-2026-001" untuk pelamar ke-1 Direktur Utama di Perumdam
// Among Tirto tahun 2026. Dibentuk sekali, saat seluruh dokumen wajib
// peserta sudah APPROVED — lihat app/(app)/documents/actions.ts.

const SKIP_WORDS = new Set(["PT", "CV", "DAN", "DI", "KE", "PADA", "PERUM", "PERUMDA", "PERUMDAM"]);

/** Ambil inisial dari beberapa kata (mis. "Direktur Utama" -> "DU"),
 * melewati kata sambung/bentuk-badan-hukum umum supaya inisial tetap
 * bermakna (mis. "PT. Batu Wisata Resource" -> "BWR", bukan "PBWR"). */
export function initialsFrom(text: string, maxLen = 4): string {
  const words = text
    .replace(/[.,()]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const meaningful = words.filter((w) => !SKIP_WORDS.has(w.toUpperCase()));
  const source = meaningful.length ? meaningful : words;
  const initials = source.map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, maxLen);
  return initials || text.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "XXX";
}

/** Bagian kode yang stabil untuk satu kombinasi jabatan+BUMD+tahun — dipakai
 * baik untuk membentuk kode baru maupun untuk mencari urutan berikutnya
 * (hitung kode_peserta existing yang berawalan prefix ini, lihat
 * documents/actions.ts). */
export function kodePesertaPrefix(jabatan: string, bumdNama: string, tahun: number): string {
  return `${initialsFrom(jabatan, 3)}-${initialsFrom(bumdNama, 4)}-${tahun}`;
}

export function buildKodePeserta(jabatan: string, bumdNama: string, tahun: number, urutan: number): string {
  return `${kodePesertaPrefix(jabatan, bumdNama, tahun)}-${String(urutan).padStart(3, "0")}`;
}
