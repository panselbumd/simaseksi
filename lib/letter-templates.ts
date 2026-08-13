// Formats and wording here follow Permendagri Nomor 1 Tahun 2023 tentang
// Tata Naskah Dinas di Lingkungan Pemerintah Daerah, cross-checked against
// real Pansel BUMD documents from other provinces/kabupaten that have run
// the same kind of process (e.g. Pemprov Sumatera Utara's Panitia Seleksi
// Anggota Komisaris dan Direksi PT. PPSU, and Kabupaten Subang's Panitia
// Seleksi Direksi BUMD PT. Subang Sejahtera).
//
// Two structurally different naskah dinas shapes are used, matching the
// regulation's classification (Pasal 14, Permendagri 1/2023):
//   - "korespondensi": ordinary surat-dinas shape — right-aligned date,
//     then Nomor/Perihal lines, addressed and signed by the Panitia. Used
//     for Undangan and Rekomendasi, which are genuinely correspondence
//     (sent TO someone).
//   - "judul": centered title-block shape — "PENGUMUMAN" / "BERITA ACARA"
//     / "SURAT TUGAS" / "KEPUTUSAN ..." centered, followed by "NOMOR: ..."
//     and "TENTANG ...", with NO Nomor:/Perihal: correspondence lines and
//     no addressee. Used for Pengumuman, Surat Tugas, Berita Acara,
//     Keputusan, Penetapan, and Pakta Integritas — these are declarations/
//     determinations, not letters sent to a specific recipient, and
//     Permendagri 1/2023 gives each of them this distinct structure.
//
// Pakta Integritas is additionally `signatureRole: "peserta"` — it's a
// statement the CANDIDATE signs, not the Panitia, so the signature block
// must show the candidate's own name rather than "Ketua Panitia Seleksi".

export type LetterLayout = "korespondensi" | "judul";
export type SignatureRole = "panitia" | "peserta";

export type LetterTemplate = {
  id: string;
  nama: string;
  kategori: string;
  layout: LetterLayout;
  /** Only for layout "judul". May contain {{PLACEHOLDER}} tokens. */
  judulDinas?: string;
  /** Only for layout "judul" — the "TENTANG ..." line. May contain {{PLACEHOLDER}} tokens. */
  tentang?: string;
  /** Who signs this document. Defaults to "panitia" (Ketua Panitia Seleksi). */
  signatureRole?: SignatureRole;
  /**
   * Body text. Use a blank line (\n\n) between paragraphs (rendered with
   * paragraph spacing) and a single \n for a hard line break within one
   * block — e.g. the Hari/Tanggal/Waktu/Tempat block in Undangan, or a
   * Nama/Jabatan block, which should stay visually together without the
   * extra gap a new paragraph would add.
   */
  template: string;
};

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "lt-pengumuman", nama: "Pengumuman", kategori: "Pengumuman",
    layout: "judul",
    judulDinas: "PENGUMUMAN",
    tentang: "{{JABATAN}} PADA {{BUMD}}",
    template:
      "Berdasarkan {{DASAR_HUKUM}}, {{PANITIA}} dengan ini mengumumkan hal-hal sebagai berikut:\n\n" +
      "1. Proses seleksi {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} dilaksanakan sesuai dengan tahapan dan jadwal yang ditetapkan oleh {{PANITIA}};\n" +
      "2. Setiap peserta wajib mengikuti seluruh tahapan seleksi sesuai dengan ketentuan yang berlaku dan tidak dapat diwakilkan kepada pihak lain;\n" +
      "3. Keputusan {{PANITIA}} pada setiap tahapan seleksi bersifat final dan tidak dapat diganggu gugat.\n\n" +
      "Demikian pengumuman ini disampaikan untuk diketahui dan dilaksanakan sebagaimana mestinya.",
  },
  {
    id: "lt-undangan", nama: "Undangan", kategori: "Undangan",
    layout: "korespondensi",
    template:
      "Sehubungan dengan pelaksanaan seleksi {{JABATAN}} pada {{BUMD}} periode {{PERIODE}}, dengan ini kami mengundang:\n\n" +
      "Nama : {{NAMA_PESERTA}}\n\n" +
      "untuk hadir pada:\n\n" +
      "Hari/Tanggal : {{TANGGAL}}\n" +
      "Waktu : 09.00 WIB s.d. selesai\n" +
      "Tempat : Sekretariat {{PANITIA}}\n" +
      "Acara : Tahapan seleksi {{JABATAN}} pada {{BUMD}}\n\n" +
      "Mengingat pentingnya acara tersebut, kami mohon kehadiran Saudara/i tepat waktu dengan membawa dokumen persyaratan yang telah ditentukan.\n\n" +
      "Atas perhatian dan kehadiran Saudara/i, kami ucapkan terima kasih.",
  },
  {
    id: "lt-surat-tugas", nama: "Surat Tugas", kategori: "Surat Tugas",
    layout: "judul",
    judulDinas: "SURAT TUGAS",
    tentang: "PELAKSANAAN UJI KOMPETENSI DAN KELAYAKAN {{JABATAN}} PADA {{BUMD}}",
    template:
      "Berdasarkan {{DASAR_HUKUM}}, {{PANITIA}} dengan ini menugaskan:\n\n" +
      "{{TIM_UKK}}\n\n" +
      "Untuk melaksanakan Uji Kompetensi dan Kelayakan (UKK) terhadap calon {{JABATAN}} pada {{BUMD}} periode {{PERIODE}}, dengan ketentuan sebagai berikut:\n\n" +
      "1. Melaksanakan tugas dengan penuh tanggung jawab, objektif, dan sesuai dengan kode etik yang berlaku;\n" +
      "2. Menyampaikan hasil pelaksanaan tugas kepada {{PANITIA}} dalam bentuk Berita Acara;\n" +
      "3. Surat tugas ini berlaku sejak tanggal ditetapkan sampai dengan tahapan dimaksud selesai dilaksanakan.\n\n" +
      "Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.",
  },
  {
    id: "lt-ba", nama: "Berita Acara", kategori: "Berita Acara",
    layout: "judul",
    judulDinas: "BERITA ACARA",
    tentang: "HASIL SELEKSI {{JABATAN}} PADA {{BUMD}}",
    template:
      "Pada hari ini, {{TANGGAL}}, bertempat di Sekretariat {{PANITIA}}, kami yang bertanda tangan di bawah ini selaku {{PANITIA}} telah melaksanakan tahapan seleksi {{JABATAN}} pada {{BUMD}} periode {{PERIODE}}, dengan hasil sebagai berikut:\n\n" +
      "1. Tahapan seleksi telah dilaksanakan sesuai dengan {{DASAR_HUKUM}};\n" +
      "2. Hasil penilaian tahapan dimaksud tercantum dalam lampiran yang tidak terpisahkan dari Berita Acara ini;\n" +
      "3. Hasil sebagaimana dimaksud bersifat final dan menjadi dasar bagi {{PANITIA}} untuk tahapan selanjutnya.\n\n" +
      "Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.",
  },
  {
    id: "lt-pakta", nama: "Pakta Integritas", kategori: "Pernyataan",
    layout: "judul",
    judulDinas: "PAKTA INTEGRITAS",
    signatureRole: "peserta",
    template:
      "Saya yang bertanda tangan di bawah ini:\n\n" +
      "Nama : {{NAMA_PESERTA}}\n" +
      "Jabatan yang dilamar : {{JABATAN}}\n" +
      "BUMD : {{BUMD}}\n\n" +
      "menyatakan dengan sesungguhnya bahwa saya:\n\n" +
      "1. Akan melaksanakan tugas sebagai {{JABATAN}} pada {{BUMD}} dengan penuh integritas, jujur, dan bertanggung jawab;\n" +
      "2. Tidak akan melakukan tindakan yang dapat menimbulkan konflik kepentingan dalam pelaksanaan tugas;\n" +
      "3. Bersedia menerima sanksi sesuai dengan ketentuan yang berlaku apabila melanggar pernyataan ini.\n\n" +
      "Demikian Pakta Integritas ini saya buat dengan sebenar-benarnya tanpa ada paksaan dari pihak manapun.",
  },
  {
    id: "lt-rekomendasi", nama: "Rekomendasi", kategori: "Rekomendasi",
    layout: "korespondensi",
    template:
      "Berdasarkan hasil pelaksanaan Uji Kompetensi dan Kelayakan (UKK) sesuai dengan {{DASAR_HUKUM}}, {{PANITIA}} dengan ini merekomendasikan:\n\n" +
      "Nama : {{NAMA_PESERTA}}\n\n" +
      "sebagai calon {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} untuk diproses lebih lanjut sesuai dengan ketentuan yang berlaku.\n\n" +
      "Demikian surat rekomendasi ini dibuat untuk dipergunakan sebagaimana mestinya.",
  },
  {
    id: "lt-keputusan", nama: "Keputusan", kategori: "Keputusan",
    layout: "judul",
    judulDinas: "KEPUTUSAN {{PANITIA}}",
    tentang: "PENETAPAN {{NAMA_PESERTA}} SEBAGAI {{JABATAN}} PADA {{BUMD}} PERIODE {{PERIODE}}",
    template:
      "Menimbang:\n" +
      "a. bahwa berdasarkan hasil seleksi yang telah dilaksanakan, {{NAMA_PESERTA}} dinyatakan memenuhi syarat sebagai {{JABATAN}} pada {{BUMD}} periode {{PERIODE}};\n" +
      "b. bahwa berdasarkan pertimbangan sebagaimana dimaksud pada huruf a, perlu ditetapkan Keputusan {{PANITIA}}.\n\n" +
      "Mengingat:\n" +
      "{{DASAR_HUKUM}}.\n\n" +
      "MEMUTUSKAN:\n\n" +
      "Menetapkan:\n\n" +
      "KESATU : Menetapkan {{NAMA_PESERTA}} sebagai {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} terhitung sejak tanggal ditetapkan;\n" +
      "KEDUA : Keputusan ini mulai berlaku pada tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diadakan perbaikan sebagaimana mestinya.",
  },
  {
    id: "lt-penetapan", nama: "Penetapan", kategori: "Penetapan",
    layout: "judul",
    judulDinas: "PENETAPAN",
    tentang: "{{NAMA_PESERTA}} SEBAGAI {{JABATAN}} PADA {{BUMD}}",
    template:
      "Dengan ditetapkannya Keputusan {{PANITIA}} Nomor {{NOMOR}} tanggal {{TANGGAL}}, dengan ini dinyatakan bahwa:\n\n" +
      "Nama : {{NAMA_PESERTA}}\n\n" +
      "resmi diangkat sebagai {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} terhitung sejak tanggal ditetapkan.\n\n" +
      "Demikian penetapan ini dibuat untuk diketahui dan dilaksanakan sebagaimana mestinya.",
  },
];

export function findTemplate(id: string): LetterTemplate | undefined {
  return LETTER_TEMPLATES.find((t) => t.id === id);
}

export function fillTemplate(tpl: string, data: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => (data[k] !== undefined && data[k] !== "" ? data[k] : m));
}

/** Splits filled body text into paragraphs (blank-line separated). Each
 * paragraph may still contain internal single \n hard line breaks, which
 * callers render according to their output format (CSS white-space:
 * pre-line for HTML, native \n support for react-pdf Text, or explicit
 * line-break runs for docx). */
export function splitParagraphs(isi: string): string[] {
  return isi.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** For layout "judul" templates: the centered title-block text (judul +
 * "TENTANG" line), with placeholders filled in. Returns null for
 * "korespondensi" templates, which use the ordinary Nomor:/Perihal: shape
 * instead. */
export function letterHeaderFor(tpl: LetterTemplate, data: Record<string, string>) {
  if (tpl.layout !== "judul") return null;
  return {
    judul: fillTemplate(tpl.judulDinas || tpl.nama.toUpperCase(), data),
    tentang: tpl.tentang ? fillTemplate(tpl.tentang, data) : undefined,
  };
}

/** Reconstructs the exact {{PLACEHOLDER}} data map used at creation time
 * (see createLetterAction) from an already-saved letter row, so the print/
 * PDF/docx renderers and the "judul" header can be built without a second
 * copy of this mapping living in each of those files. */
export function letterDataFrom(
  letter: { nomor: string; tanggal: string; nama_peserta: string | null; jabatan: string | null; periode: string | null; dasar_hukum: string | null },
  bumdNama: string
): Record<string, string> {
  const panitia = `Panitia Seleksi ${letter.jabatan ?? ""} ${bumdNama}`.trim();
  return {
    NOMOR: letter.nomor,
    TANGGAL: fmtTanggalPanjang(letter.tanggal),
    BUMD: bumdNama,
    NAMA_PESERTA: letter.nama_peserta || "[Nama Peserta]",
    JABATAN: letter.jabatan || "-",
    PERIODE: letter.periode || "-",
    DASAR_HUKUM: letter.dasar_hukum || "—",
    PANITIA: panitia,
    TIM_UKK: "Tim Uji Kompetensi dan Kelayakan",
  };
}

export function fmtTanggalPanjang(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
