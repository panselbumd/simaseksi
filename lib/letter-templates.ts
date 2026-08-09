// Ported 1:1 from index.html's `db.letters` seed (MODULE — SURAT / DOCUMENT
// GENERATOR). Kept as a static module (not a DB table) so the 8 standard
// letter types stay in sync with the prototype and require a code change
// (reviewed in Git) rather than an ad-hoc DB edit to alter official wording.

export type LetterTemplate = {
  id: string;
  nama: string;
  kategori: string;
  template: string; // {{PLACEHOLDER}} tokens filled by fillTemplate()
};

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "lt-pengumuman", nama: "Pengumuman", kategori: "Pengumuman",
    template: "Dengan ini diumumkan kepada seluruh peserta seleksi {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} bahwa tahapan seleksi akan dilaksanakan sesuai jadwal yang ditetapkan oleh {{PANITIA}}.",
  },
  {
    id: "lt-undangan", nama: "Undangan", kategori: "Undangan",
    template: "Sehubungan dengan pelaksanaan seleksi {{JABATAN}} pada {{BUMD}}, dengan ini kami mengundang Saudara/i {{NAMA_PESERTA}} untuk hadir pada tahapan seleksi sesuai jadwal terlampir.",
  },
  {
    id: "lt-surat-tugas", nama: "Surat Tugas", kategori: "Surat Tugas",
    template: "Berdasarkan {{DASAR_HUKUM}}, {{PANITIA}} menugaskan {{TIM_UKK}} untuk melaksanakan Uji Kompetensi dan Kelayakan calon {{JABATAN}} pada {{BUMD}} periode {{PERIODE}}.",
  },
  {
    id: "lt-ba", nama: "Berita Acara", kategori: "Berita Acara",
    template: "Pada hari ini, {{TANGGAL}}, telah dilaksanakan tahapan seleksi {{JABATAN}} pada {{BUMD}} dengan hasil sebagaimana tercantum dalam lampiran Berita Acara Nomor {{NOMOR}}.",
  },
  {
    id: "lt-pakta", nama: "Pakta Integritas", kategori: "Pernyataan",
    template: "Yang bertanda tangan di bawah ini, {{NAMA_PESERTA}}, menyatakan dengan sesungguhnya akan melaksanakan tugas sebagai {{JABATAN}} pada {{BUMD}} dengan penuh integritas dan tanpa konflik kepentingan.",
  },
  {
    id: "lt-rekomendasi", nama: "Rekomendasi", kategori: "Rekomendasi",
    template: "{{PANITIA}} merekomendasikan {{NAMA_PESERTA}} sebagai calon {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} berdasarkan hasil penilaian UKK sesuai {{DASAR_HUKUM}}.",
  },
  {
    id: "lt-keputusan", nama: "Keputusan", kategori: "Keputusan",
    template: "Menetapkan {{NAMA_PESERTA}} sebagai {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} terhitung sejak tanggal {{TANGGAL}} berdasarkan Keputusan Nomor {{NOMOR}}.",
  },
  {
    id: "lt-penetapan", nama: "Penetapan", kategori: "Penetapan",
    template: "Dengan ditetapkannya Keputusan Nomor {{NOMOR}} tanggal {{TANGGAL}}, {{NAMA_PESERTA}} resmi diangkat sebagai {{JABATAN}} pada {{BUMD}}.",
  },
];

export function findTemplate(id: string): LetterTemplate | undefined {
  return LETTER_TEMPLATES.find((t) => t.id === id);
}

export function fillTemplate(tpl: string, data: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (data[k] !== undefined && data[k] !== "" ? data[k] : m));
}

export function fmtTanggalPanjang(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
