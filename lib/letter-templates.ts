// Formats and wording here follow Permendagri Nomor 1 Tahun 2023 tentang
// Tata Naskah Dinas di Lingkungan Pemerintah Daerah, dan disusun mengikuti
// paket naskah dinas resmi Seleksi Calon Direksi/Komisaris/Dewan Pengawas
// BUMD (13 Berita Acara, 3 Pengumuman, 2 Surat Internal Panitia, 5 Surat
// Kepada Peserta) — lihat juga PERUBAHAN_2026-08-15-identitas-panitia.md.
//
// Dua bentuk naskah dinas dipakai (Pasal 14, Permendagri 1/2023):
//   - "korespondensi": surat-dinas biasa — tanggal rata kanan, lalu
//     Nomor/Sifat/Lampiran/Hal, ditujukan ke pihak tertentu, ditandatangani
//     Panitia. Dipakai untuk Undangan/Pemberitahuan (Surat Internal Panitia,
//     Surat Kepada Peserta) dan Rekomendasi.
//   - "judul": blok judul di tengah — "BERITA ACARA TENTANG ..." /
//     "PENGUMUMAN ..." / "SURAT TUGAS" / "KEPUTUSAN ..." — tanpa baris
//     Nomor:/Perihal: dan tanpa alamat tujuan. Dipakai untuk Berita Acara,
//     Pengumuman, Surat Tugas, Keputusan, Penetapan, dan Pakta Integritas.
//
// Tanda tangan (lihat lib/letter-signature.ts untuk sumber data Nama+NIP):
//   - "single"  : hanya Ketua Panitia Seleksi menandatangani (satu blok).
//   - "table5"  : Ketua, Sekretaris, dan 3 Anggota menandatangani secara
//                 individual dalam tabel No/Nama/Jabatan/Tanda Tangan
//                 (dipakai Berita Acara tahapan teknis — verifikasi, UKK,
//                 presentasi, dst).
//   - "block3"  : blok 3 kolom Ketua / Sekretaris / Anggota (satu wakil),
//                 masing-masing menampilkan Nama + NIP (dipakai Berita
//                 Acara rekapitulasi/penetapan/penutupan lintas-tahapan).
//   - "peserta" : yang menandatangani adalah Peserta/Calon, bukan Panitia
//                 (Pakta Integritas).

export type LetterLayout = "korespondensi" | "judul";
export type SignatureSpec = { kind: "single" | "table5" | "block3" | "peserta" };

export type LetterTemplate = {
  id: string;
  nama: string;
  kategori: string;
  layout: LetterLayout;
  /** Only for layout "judul". May contain {{PLACEHOLDER}} tokens. */
  judulDinas?: string;
  /** Only for layout "judul" — the "TENTANG ..." line. May contain {{PLACEHOLDER}} tokens. */
  tentang?: string;
  signature: SignatureSpec;
  /**
   * Body text. Use a blank line (\n\n) between paragraphs (rendered with
   * paragraph spacing) and a single \n for a hard line break within one
   * block — e.g. the Hari/Tanggal/Waktu/Tempat block in Undangan, or a
   * Nama/Jabatan block, which should stay visually together without the
   * extra gap a new paragraph would add. Bagian yang tidak tersedia dari
   * data seleksi (mis. [tempat], [jam], nama tamu Sekda) sengaja dibiarkan
   * sebagai placeholder berkurung — Panitia melengkapinya langsung di
   * layar Ubah Surat sebelum difinalisasi, persis seperti naskah aslinya.
   */
  template: string;
};

const SIG_SINGLE: SignatureSpec = { kind: "single" };
const SIG_TABLE5: SignatureSpec = { kind: "table5" };
const SIG_BLOCK3: SignatureSpec = { kind: "block3" };
const SIG_PESERTA: SignatureSpec = { kind: "peserta" };

const PENUTUP_BA =
  "Demikian Berita Acara ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagai dokumen resmi pelaksanaan seleksi dan bagian dari dokumentasi serta pertanggungjawaban Panitia Seleksi.";

export const LETTER_TEMPLATES: LetterTemplate[] = [
  // ────────────────────────────────────────────────────────────────────
  // BERITA ACARA — table5 (Ketua/Sekretaris/Anggota1-3 tanda tangan individual)
  // ────────────────────────────────────────────────────────────────────
  {
    id: "ba-persiapan", nama: "BA Rapat Persiapan dan Penetapan Rencana Kerja", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG RAPAT PERSIAPAN DAN PENETAPAN RENCANA KERJA",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan rapat persiapan dan penetapan rencana kerja dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Rapat membahas dasar hukum, tahapan, jadwal, kebutuhan anggaran, sarana prasarana, sekretariat, pembagian tugas, komunikasi, dan pengamanan dokumen;\n" +
      "2. Panitia menyepakati tahapan seleksi: pengumuman/pendaftaran/verifikasi/UKK/presentasi-wawancara/wawancara KPM/hasil akhir;\n" +
      "3. Pembagian tugas Panitia Seleksi dan Sekretariat ditetapkan dalam matriks terlampir.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: rencana kerja dan jadwal; matriks pembagian tugas; daftar hadir.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-pendaftaran", nama: "BA Penerimaan dan Penutupan Pendaftaran", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PENERIMAAN DAN PENUTUPAN PENDAFTARAN",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan penerimaan dan penutupan pendaftaran dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Pendaftaran dibuka [tanggal pembukaan] [jam] dan ditutup [tanggal penutupan] [jam] sesuai pengumuman;\n" +
      "2. Jumlah pendaftar: [..] orang;\n" +
      "3. Berkas diterima melalui [loket/aplikasi/email/metode lain] dan dicatat dalam daftar penerimaan;\n" +
      "4. Setelah batas waktu berakhir, pendaftaran dinyatakan ditutup sesuai mekanisme yang ditetapkan.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: daftar registrasi; tanda terima; rekap pendaftar; dokumentasi.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-verifikasi", nama: "BA Verifikasi dan Pemeriksaan Dokumen Administrasi", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG VERIFIKASI DAN PEMERIKSAAN DOKUMEN ADMINISTRASI",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan verifikasi dan pemeriksaan dokumen administrasi dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Pemeriksaan meliputi identitas, usia, pendidikan, pengalaman, persyaratan khusus, surat pernyataan, dan dokumen lain;\n" +
      "2. Hasil pemeriksaan dicatat dalam checklist masing-masing peserta;\n" +
      "3. Dokumen yang tidak sesuai ditindaklanjuti sesuai Juklak/Juknis.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: checklist verifikasi; daftar dokumen; berita klarifikasi bila ada.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-tapseladm", nama: "BA Penetapan Hasil Seleksi Administrasi", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PENETAPAN HASIL SELEKSI ADMINISTRASI",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan penetapan hasil seleksi administrasi dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Jumlah peserta diverifikasi: [..] orang;\n" +
      "2. Memenuhi syarat: [..] orang; tidak memenuhi syarat: [..] orang;\n" +
      "3. Daftar nama/kode dan status peserta tercantum dalam lampiran;\n" +
      "4. Hasil diumumkan melalui mekanisme resmi sesuai Juklak/Juknis.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: daftar lulus; daftar tidak lulus; rekap verifikasi; draf pengumuman.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-ukk", nama: "BA Pelaksanaan Uji Kelayakan dan Kepatutan (UKK)", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PELAKSANAAN UJI KELAYAKAN DAN KEPATUTAN (UKK)",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan pelaksanaan UKK [tes tertulis/psikotes/presentasi/wawancara/metode lain] dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. UKK dilaksanakan [tanggal] pukul [..] sesuai jadwal;\n" +
      "2. Peserta terjadwal [..]; hadir [..]; tidak hadir [..];\n" +
      "3. Pelaksanaan mengikuti instrumen, durasi, indikator, bobot, dan tata tertib;\n" +
      "4. Penilaian dilakukan secara mandiri dan objektif oleh Tim UKK.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: daftar hadir peserta; daftar hadir Tim UKK; instrumen penilaian; tata tertib; dokumentasi.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-rekapukk", nama: "BA Rekapitulasi Hasil Uji Kelayakan dan Kepatutan", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG REKAPITULASI HASIL UJI KELAYAKAN DAN KEPATUTAN",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan rekapitulasi hasil UKK dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Rekapitulasi dilakukan berdasarkan lembar penilaian yang telah ditandatangani penilai;\n" +
      "2. Perhitungan mengikuti formula dan bobot Juklak/Juknis;\n" +
      "3. Kesalahan hitung, apabila ada, dikoreksi berdasarkan dokumen sumber dan dicatat;\n" +
      "4. Hasil individual dan rekapitulasi disimpan secara terbatas.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: rekap nilai; lembar penilaian; dokumen perhitungan; koreksi bila ada.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-presentasi", nama: "BA Pelaksanaan Presentasi dan Wawancara", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PELAKSANAAN PRESENTASI DAN WAWANCARA",
    signature: SIG_TABLE5,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan presentasi dan wawancara peserta dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Peserta menyampaikan materi sesuai tema [tema];\n" +
      "2. Wawancara meliputi kompetensi, integritas, kepemimpinan, pemahaman BUMD, strategi, tata kelola, risiko, dan aspek lain sesuai Juklak/Juknis;\n" +
      "3. Peserta dinilai dengan indikator dan bobot yang sama.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: jadwal sesi; materi presentasi; lembar penilaian; catatan wawancara; daftar hadir.\n\n" +
      PENUTUP_BA,
  },

  // ────────────────────────────────────────────────────────────────────
  // BERITA ACARA — block3 (Ketua / Sekretaris / Anggota, Nama+NIP)
  // ────────────────────────────────────────────────────────────────────
  {
    id: "ba-rekap-presentasi", nama: "BA Rekapitulasi Hasil Presentasi dan Wawancara", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG REKAPITULASI HASIL PRESENTASI DAN WAWANCARA",
    signature: SIG_BLOCK3,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat], telah dilaksanakan kegiatan rekapitulasi nilai presentasi dan wawancara dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun], dihadiri Panitia Seleksi dan Tim Uji Kelayakan dan Kepatutan.\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Nilai dihitung sesuai indikator dan bobot;\n" +
      "2. Rekap diverifikasi dengan lembar penilaian masing-masing penilai;\n" +
      "3. Rekapitulasi menjadi salah satu komponen hasil seleksi dan tidak dengan sendirinya merupakan keputusan pengangkatan.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: rekap nilai; lembar penilaian; dokumen perhitungan.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-wwcrkpm", nama: "BA Pelaksanaan Wawancara dengan Kuasa Pemilik Modal (KPM)", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PELAKSANAAN WAWANCARA DENGAN KUASA PEMILIK MODAL (KPM)",
    signature: SIG_BLOCK3,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat] pukul [..] WIB s.d. selesai, telah dilaksanakan kegiatan wawancara dengan KPM dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun], dihadiri KPM dan Panitia Seleksi.\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Wawancara dilaksanakan terhadap [..] peserta untuk jabatan {{JABATAN}};\n" +
      "2. Materi meliputi visi-misi, komitmen, integritas, kepemimpinan, strategi pencapaian target, tata kelola, dan aspek relevan lainnya;\n" +
      "3. Hasil dituangkan dalam instrumen/catatan penilaian sesuai mekanisme.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: daftar peserta; instrumen wawancara KPM; catatan/lembar penilaian; daftar hadir.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-bast-hasil", nama: "BA Serah Terima Laporan Hasil", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG SERAH TERIMA LAPORAN HASIL",
    signature: SIG_BLOCK3,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat] pukul [..] WIB s.d. selesai, telah dilaksanakan kegiatan serah terima laporan hasil seleksi kepada KPM/pejabat berwenang dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "a. Panitia menyerahkan laporan yang memuat tahapan, jumlah peserta, hasil administrasi, UKK, wawancara, rekapitulasi nilai, peringkat, rekomendasi, dan dokumen pendukung;\n" +
      "b. Penerima menyatakan telah menerima dokumen untuk dipergunakan sesuai kewenangan;\n" +
      "c. Dokumen rahasia tetap diperlakukan sesuai ketentuan keamanan informasi dan akses.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: laporan akhir; rekapitulasi nilai; daftar peringkat/rekomendasi; berita acara tahapan.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-rekap-nilai", nama: "BA Rekapitulasi Nilai Seluruh Tahapan", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG REKAPITULASI NILAI SELURUH TAHAPAN",
    signature: SIG_BLOCK3,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat] pukul [..] WIB s.d. selesai, telah dilaksanakan kegiatan penggabungan nilai seluruh tahapan dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Komponen penilaian yang direkap meliputi UKK/presentasi-wawancara/wawancara KPM/komponen lain sesuai Juknis;\n" +
      "2. Bobot masing-masing komponen mengikuti Juklak/Juknis;\n" +
      "3. Nilai akhir dihitung dengan formula yang dapat diverifikasi dan diaudit;\n" +
      "4. Rekap menjadi dasar pembahasan peringkat dan rekomendasi.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: matriks nilai; formula; rekap nilai akhir; dokumen sumber.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-penutupan", nama: "BA Penyelesaian Tugas dan Penutupan Panitia", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PENYELESAIAN TUGAS DAN PENUTUPAN PANITIA",
    signature: SIG_BLOCK3,
    template:
      "Pada hari [hari], tanggal [tanggal] telah dilaksanakan kegiatan penyelesaian tugas dan penutupan Panitia Seleksi dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun], bertempat di [tempat] pukul [..] WIB s.d. selesai.\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Seluruh tahapan seleksi telah selesai dilaksanakan sesuai Juklak/Juknis, kecuali tindak lanjut yang menjadi kewenangan pejabat lain;\n" +
      "2. Laporan hasil seleksi telah disampaikan kepada KPM/pejabat berwenang pada tanggal [tanggal laporan];\n" +
      "3. Dokumen fisik dan digital telah diinventarisasi dan disimpan/diserahkan sesuai ketentuan kearsipan;\n" +
      "4. Administrasi, pertanggungjawaban kegiatan, dan dokumentasi Panitia telah diselesaikan/ditindaklanjuti;\n" +
      "5. Panitia menyatakan tugas selesai sepanjang tidak terdapat penugasan lanjutan.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: inventaris arsip; bukti serah terima arsip; laporan akhir; dokumen pertanggungjawaban.\n\n" +
      PENUTUP_BA,
  },
  {
    id: "ba-rekom", nama: "BA Penetapan Peringkat dan Rekomendasi Hasil Akhir", kategori: "Berita Acara",
    layout: "judul", judulDinas: "BERITA ACARA TENTANG PENETAPAN PERINGKAT DAN REKOMENDASI HASIL AKHIR",
    signature: SIG_BLOCK3,
    template:
      "Pada hari [hari], tanggal [tanggal] bertempat di [tempat] pukul [..] WIB s.d. selesai, telah dilaksanakan kegiatan penetapan peringkat dan rekomendasi hasil akhir dalam rangka {{JABATAN}} pada {{BUMD}} Tahun [tahun].\n\n" +
      "I. HASIL PELAKSANAAN\n\n" +
      "1. Panitia memeriksa kembali kelengkapan dan konsistensi rekapitulasi;\n" +
      "2. Peringkat ditetapkan berdasarkan nilai akhir sesuai metode yang telah ditentukan;\n" +
      "3. Panitia menetapkan rekomendasi sesuai kategori dalam Juklak/Juknis;\n" +
      "4. Rekomendasi merupakan dasar bagi pejabat/KPM/RUPS yang berwenang dan tidak menggantikan kewenangan pengangkatan.\n\n" +
      "II. DOKUMEN/LAMPIRAN PENDUKUNG: rekap nilai akhir; daftar peringkat; matriks rekomendasi.\n\n" +
      PENUTUP_BA,
  },

  // ────────────────────────────────────────────────────────────────────
  // PENGUMUMAN — single (Ketua Panitia Seleksi)
  // ────────────────────────────────────────────────────────────────────
  {
    id: "peng-seleksi", nama: "Pengumuman Seleksi Calon Direksi/Komisaris/Dewan Pengawas", kategori: "Pengumuman",
    layout: "judul", judulDinas: "PENGUMUMAN {{JABATAN}} PADA {{BUMD}}",
    signature: SIG_SINGLE,
    template:
      "Dalam rangka pengisian jabatan {{JABATAN}} pada {{BUMD}} dan berdasarkan {{DASAR_HUKUM}}, Panitia Seleksi membuka kesempatan kepada Warga Negara Indonesia yang memenuhi persyaratan untuk mengikuti proses seleksi.\n\n" +
      "I. PERSYARATAN\n\n" +
      "1. Warga Negara Indonesia dan bertakwa kepada Tuhan Yang Maha Esa;\n" +
      "2. Sehat jasmani dan rohani sesuai dengan jabatan yang akan diduduki;\n" +
      "3. Memiliki keahlian, integritas, kepemimpinan, pengalaman, kejujuran, perilaku yang baik, dan dedikasi yang tinggi untuk memajukan dan mengembangkan BUMD;\n" +
      "4. Memahami penyelenggaraan pemerintahan daerah dan/atau bidang usaha BUMD sesuai jabatan yang dilamar;\n" +
      "5. Memenuhi persyaratan pendidikan, pengalaman kerja, usia, dan persyaratan lain sesuai ketentuan peraturan perundang-undangan dan Juklak/Juknis;\n" +
      "6. Tidak pernah dinyatakan pailit atau menjadi anggota Direksi/Dewan Komisaris/Dewan Pengawas yang dinyatakan bersalah menyebabkan badan usaha dinyatakan pailit;\n" +
      "7. Tidak sedang menjalani sanksi pidana atau memiliki kondisi hukum lain yang mengakibatkan tidak dapat menduduki jabatan;\n" +
      "8. Bersedia menandatangani pakta integritas dan surat pernyataan yang dipersyaratkan.\n\n" +
      "II. DOKUMEN PERSYARATAN: surat lamaran; daftar riwayat hidup; pas foto terbaru; fotokopi KTP; fotokopi ijazah dan transkrip nilai; dokumen pengalaman kerja; surat keterangan sehat jasmani dan rohani; SKCK; pakta integritas; surat pernyataan tidak pernah dihukum pidana; dokumen pendukung lain sesuai Juklak/Juknis.\n\n" +
      "III. KETENTUAN PENDAFTARAN\n\n" +
      "1. Pendaftaran dilaksanakan pada [hari/tanggal] sampai dengan [hari/tanggal] pukul [..] WIB;\n" +
      "2. Dokumen disampaikan melalui [loket/alamat situs/email] sesuai tata cara yang ditetapkan;\n" +
      "3. Seluruh dokumen harus lengkap, benar, dapat dibaca, dan dapat dipertanggungjawabkan — peserta bertanggung jawab penuh atas kebenaran dokumen yang disampaikan;\n" +
      "4. Panitia Seleksi berhak melakukan klarifikasi dan/atau verifikasi terhadap dokumen peserta; dokumen yang tidak lengkap atau tidak memenuhi persyaratan dinyatakan tidak memenuhi syarat administrasi;\n" +
      "5. Keputusan Panitia Seleksi bersifat objektif, transparan, akuntabel, dan sesuai ketentuan peraturan perundang-undangan.\n\n" +
      "IV. INFORMASI DAN KONTAK\n" +
      "Sekretariat Panitia Seleksi : [Alamat]\n" +
      "Telepon/WhatsApp : [Nomor]\n" +
      "Email : [Email]\n" +
      "Jam layanan : [Hari dan Jam]\n\n" +
      "Demikian pengumuman ini disampaikan untuk menjadi perhatian dan dipergunakan sebagaimana mestinya.",
  },
  {
    id: "peng-hasil-adm", nama: "Pengumuman Hasil Seleksi Administrasi", kategori: "Pengumuman",
    layout: "judul", judulDinas: "PENGUMUMAN HASIL SELEKSI DOKUMEN ADMINISTRASI PESERTA {{JABATAN}} PADA {{BUMD}}",
    signature: SIG_SINGLE,
    template:
      "Berdasarkan hasil verifikasi dan penilaian terhadap dokumen administrasi peserta {{JABATAN}} pada {{BUMD}}, Panitia Seleksi menetapkan peserta yang memenuhi dan tidak memenuhi persyaratan administrasi sebagaimana tercantum dalam pengumuman ini.\n\n" +
      "I. DASAR: {{DASAR_HUKUM}}.\n\n" +
      "II. HASIL SELEKSI ADMINISTRASI\n" +
      "[Lampirkan daftar Kode/Nama Peserta — Jabatan Dilamar — Status (LULUS/TIDAK LULUS) — Keterangan — Catatan.]\n\n" +
      "III. KETENTUAN BAGI PESERTA YANG DINYATAKAN LULUS\n\n" +
      "1. Berhak mengikuti tahapan seleksi berikutnya sesuai jadwal dan Juklak/Juknis;\n" +
      "2. Wajib hadir/menyampaikan dokumen yang dipersyaratkan pada tahap berikutnya dan membawa dokumen asli untuk keperluan verifikasi apabila diminta;\n" +
      "3. Ketidakhadiran tanpa alasan yang dapat dipertanggungjawabkan atau ketidaklengkapan dokumen pada tahapan berikutnya dapat mengakibatkan peserta dinyatakan gugur sesuai ketentuan.\n\n" +
      "IV. KETENTUAN BAGI PESERTA YANG DINYATAKAN TIDAK LULUS\n\n" +
      "1. Tidak dapat mengikuti tahapan seleksi berikutnya;\n" +
      "2. Alasan ketidaklulusan mengacu pada hasil verifikasi dokumen dan persyaratan yang ditetapkan dalam Juklak/Juknis;\n" +
      "3. Apabila terdapat mekanisme klarifikasi/keberatan, pelaksanaannya mengikuti ketentuan dan batas waktu yang telah ditetapkan.\n\n" +
      "Demikian pengumuman ini disampaikan. Seluruh peserta diharapkan memperhatikan jadwal dan ketentuan yang berlaku.",
  },
  {
    id: "peng-hasil-akhir", nama: "Pengumuman Hasil Akhir Seleksi", kategori: "Pengumuman",
    layout: "judul", judulDinas: "PENGUMUMAN HASIL AKHIR {{JABATAN}} PADA {{BUMD}}",
    signature: SIG_SINGLE,
    template:
      "Berdasarkan seluruh tahapan {{JABATAN}} pada {{BUMD}}, termasuk penilaian administrasi, Uji Kelayakan dan Kepatutan (UKK), presentasi, wawancara, dan/atau tahapan lain sesuai Juklak/Juknis, Panitia Seleksi menetapkan hasil akhir seleksi sebagai berikut.\n\n" +
      "I. DASAR: {{DASAR_HUKUM}}.\n\n" +
      "II. HASIL AKHIR SELEKSI\n" +
      "[Lampirkan daftar Kode/Nama Peserta — Jabatan — Nilai Administrasi — Nilai UKK — Nilai Akhir — Keterangan/Rekomendasi.]\n\n" +
      "III. PERINGKAT / REKOMENDASI\n" +
      "[Lampirkan daftar Peringkat — Kode/Nama — Jabatan — Nilai Akhir — Rekomendasi.]\n\n" +
      "IV. KETENTUAN\n\n" +
      "1. Hasil akhir seleksi merupakan hasil penilaian kumulatif sesuai bobot dan metode yang ditetapkan dalam Juklak/Juknis;\n" +
      "2. Pengumuman hasil akhir ini merupakan hasil seleksi/rekomendasi Panitia Seleksi dan menjadi bahan bagi KPM/Kepala Daerah sesuai kewenangan untuk proses penetapan dan pengangkatan;\n" +
      "3. Penetapan dan pengangkatan calon terpilih dilaksanakan sesuai ketentuan peraturan perundang-undangan dan kewenangan KPM/Kepala Daerah;\n" +
      "4. Apabila di kemudian hari ditemukan dokumen yang tidak benar, data yang tidak sesuai, atau fakta yang memengaruhi keabsahan hasil seleksi, hasil dapat ditinjau kembali sesuai ketentuan;\n" +
      "5. Peserta wajib mengikuti seluruh proses setelah pengumuman sampai dengan penetapan/pengangkatan sesuai ketentuan yang berlaku.\n\n" +
      "Demikian pengumuman hasil akhir ini disampaikan untuk diketahui dan dipergunakan sebagaimana mestinya.",
  },

  // ────────────────────────────────────────────────────────────────────
  // SURAT INTERNAL PANITIA — korespondensi, single (Ketua Panitia Seleksi)
  // ────────────────────────────────────────────────────────────────────
  {
    id: "int-undangan-anggota", nama: "Undangan Rapat Anggota Panitia Seleksi", kategori: "Surat Internal Panitia",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : Anggota Panitia Seleksi {{JABATAN}} {{BUMD}} [di Tempat]\n\n" +
      "Dalam rangka pelaksanaan {{JABATAN}} pada {{BUMD}} Tahun [tahun], sesuai [Keputusan Kepala Daerah/KPM] Nomor [..] tentang Pembentukan Panitia Seleksi, dengan hormat kami mengundang Saudara/i selaku Anggota Panitia Seleksi untuk hadir dalam rapat sebagai berikut:\n\n" +
      "Hari/Tanggal : [Hari, tanggal bulan tahun]\n" +
      "Waktu : [Pukul] WIB s.d. selesai\n" +
      "Tempat : [Tempat/Alamat atau tautan rapat daring]\n" +
      "Agenda : Rapat Persiapan Pelaksanaan Seleksi\n\n" +
      "Mengingat pentingnya agenda tersebut, kami mengharapkan kehadiran Saudara/i tepat waktu dan berperan aktif. Apabila berhalangan hadir, mohon menyampaikan pemberitahuan kepada Sekretariat Panitia Seleksi.\n\n" +
      "Demikian undangan ini disampaikan. Atas perhatian dan kehadiran Saudara/i, disampaikan terima kasih.",
  },
  {
    id: "int-undangan-ukk", nama: "Undangan Rapat Koordinasi Panitia Seleksi dan Tim UKK", kategori: "Surat Internal Panitia",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : Anggota Panitia Seleksi dan Tim Uji Kelayakan dan Kepatutan {{JABATAN}} {{BUMD}} [di Tempat]\n\n" +
      "Dalam rangka pelaksanaan {{JABATAN}} pada {{BUMD}} Tahun [tahun], dan untuk memastikan koordinasi antara Panitia Seleksi dengan Tim Uji Kelayakan dan Kepatutan (Tim UKK), dengan hormat kami mengundang Saudara/i untuk hadir dalam rapat koordinasi sebagai berikut:\n\n" +
      "Hari/Tanggal : [Hari, tanggal bulan tahun]\n" +
      "Waktu : [Pukul] WIB s.d. selesai\n" +
      "Tempat : [Tempat/Alamat atau tautan rapat daring]\n" +
      "Agenda : Rapat Koordinasi Persiapan Pelaksanaan UKK\n\n" +
      "Pokok pembahasan meliputi: kedudukan, tugas, kewenangan, dan tanggung jawab Panitia Seleksi dan Tim UKK; metode, tahapan, jadwal, materi, instrumen, dan bobot penilaian UKK; mekanisme penilaian yang objektif, terukur, independen, transparan, dan akuntabel; formulir penilaian, berita acara, rekapitulasi nilai, pemeringkatan, dan rekomendasi; kerahasiaan data dan hasil penilaian; pakta integritas dan pencegahan konflik kepentingan; serta mekanisme penyampaian hasil UKK dari Tim UKK kepada Panitia Seleksi.\n\n" +
      "Mengingat pentingnya koordinasi tersebut, kami mengharapkan kehadiran Saudara/i tepat waktu. Setiap anggota wajib menjaga integritas, independensi, kerahasiaan data dan hasil penilaian, serta menghindari intervensi dan konflik kepentingan.\n\n" +
      "Demikian undangan ini disampaikan. Atas perhatian dan kerja sama Saudara/i, disampaikan terima kasih.",
  },

  // ────────────────────────────────────────────────────────────────────
  // SURAT KEPADA PESERTA — korespondensi, single (Ketua Panitia Seleksi)
  // ────────────────────────────────────────────────────────────────────
  {
    id: "psrt-verifikasi", nama: "Undangan Verifikasi Seleksi Administrasi", kategori: "Surat Kepada Peserta",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : {{NAMA_PESERTA}} — Peserta {{JABATAN}} pada {{BUMD}} [di Tempat]\n\n" +
      "Sehubungan dengan pelaksanaan {{JABATAN}} pada {{BUMD}} Tahun [tahun], berdasarkan hasil pendaftaran dan ketentuan Juklak/Juknis, Saudara/i diundang untuk mengikuti proses verifikasi/seleksi administrasi sebagai berikut:\n\n" +
      "Hari/Tanggal : [Hari, tanggal]\n" +
      "Waktu : [Pukul] WIB s.d. selesai\n" +
      "Tempat : [Lokasi]\n" +
      "Agenda : Verifikasi dokumen administrasi dan/atau klarifikasi persyaratan\n\n" +
      "Dokumen yang wajib dibawa: KTP asli; ijazah dan transkrip nilai asli; dokumen pengalaman kerja asli; dokumen persyaratan lain sesuai pengumuman; dokumen pendukung lain yang diminta Panitia Seleksi.\n\n" +
      "Ketentuan: peserta hadir tepat waktu dan mengenakan pakaian [ketentuan]; dokumen asli digunakan untuk verifikasi dan dikembalikan setelah pemeriksaan; ketidaksesuaian dokumen dapat menjadi dasar penetapan status tidak memenuhi syarat sesuai Juklak/Juknis; peserta wajib menjaga kebenaran seluruh informasi yang disampaikan.\n\n" +
      "Demikian undangan ini disampaikan. Atas perhatian dan kerja sama Saudara/i, disampaikan terima kasih.",
  },
  {
    id: "psrt-ukk", nama: "Undangan Pelaksanaan Uji Kelayakan dan Kepatutan (UKK)", kategori: "Surat Kepada Peserta",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : {{NAMA_PESERTA}} — Peserta Seleksi yang Dinyatakan Lulus Seleksi Administrasi [di Tempat]\n\n" +
      "Berdasarkan hasil Seleksi Administrasi dan daftar peserta yang dinyatakan memenuhi persyaratan, Saudara/i diundang mengikuti Uji Kelayakan dan Kepatutan (UKK) untuk {{JABATAN}} pada {{BUMD}} sebagai berikut:\n\n" +
      "Hari/Tanggal : [Hari, tanggal]\n" +
      "Waktu : [Pukul] WIB\n" +
      "Tempat : [Lokasi]\n" +
      "Agenda : Uji Kelayakan dan Kepatutan (UKK)\n" +
      "Materi : [Tes kemampuan dasar/tes tertulis/psikotes/metode lain sesuai Juknis]\n\n" +
      "Ketentuan pelaksanaan: peserta wajib hadir sekurang-kurangnya 30 menit sebelum dimulai; membawa KTP asli dan kartu peserta; membawa alat tulis yang diperbolehkan; tidak diperkenankan membawa atau menggunakan alat komunikasi selama tes apabila dilarang panitia; mengikuti seluruh instruksi Panitia Seleksi dan Tim UKK; peserta yang terlambat/berhalangan mengikuti ketentuan Juklak/Juknis dan keputusan Panitia Seleksi.\n\n" +
      "Demikian undangan ini disampaikan. Atas perhatian dan kerja sama Saudara/i, disampaikan terima kasih.",
  },
  {
    id: "psrt-presentasi", nama: "Undangan Presentasi dan Wawancara", kategori: "Surat Kepada Peserta",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : {{NAMA_PESERTA}} — Peserta Seleksi yang Dinyatakan Berhak Mengikuti Tahap Presentasi dan Wawancara [di Tempat]\n\n" +
      "Berdasarkan hasil tahapan seleksi sebelumnya, Saudara/i dinyatakan berhak mengikuti Presentasi dan Wawancara sebagai bagian dari proses {{JABATAN}} pada {{BUMD}}. Sehubungan dengan itu, Saudara/i diundang untuk hadir:\n\n" +
      "Hari/Tanggal : [Hari, tanggal]\n" +
      "Waktu : [Pukul] WIB — sesuai sesi\n" +
      "Tempat : [Lokasi]\n" +
      "Agenda : Presentasi dan Wawancara\n" +
      "Durasi : [30–40] menit/peserta atau sesuai Juknis\n\n" +
      "Materi presentasi: paparan visi, misi, dan strategi pengembangan BUMD; analisis kondisi dan permasalahan BUMD; program kerja dan target kinerja; strategi peningkatan tata kelola, pelayanan, kinerja keuangan, dan manajemen risiko; materi lain sesuai bidang usaha dan Juklak/Juknis.\n\n" +
      "Ketentuan: materi presentasi disiapkan dalam format PPT/PDF dan disampaikan sesuai batas waktu; peserta membawa bahan presentasi sesuai ketentuan Panitia; peserta wajib hadir sesuai jadwal sesi; penilaian dilakukan secara objektif sesuai instrumen dan bobot yang telah ditetapkan.\n\n" +
      "Demikian undangan ini disampaikan. Atas perhatian dan kerja sama Saudara/i, disampaikan terima kasih.",
  },
  {
    id: "psrt-wwcrkpm", nama: "Undangan Wawancara dengan Kuasa Pemilik Modal (KPM)", kategori: "Surat Kepada Peserta",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : {{NAMA_PESERTA}} — Peserta Seleksi yang Dinyatakan Berhak Mengikuti Wawancara KPM [di Tempat]\n\n" +
      "Berdasarkan hasil tahapan seleksi dan sesuai mekanisme pengisian jabatan {{JABATAN}} {{BUMD}}, Saudara/i diundang untuk mengikuti Wawancara dengan Kuasa Pemilik Modal (KPM) sebagai berikut:\n\n" +
      "Hari/Tanggal : [Hari, tanggal]\n" +
      "Waktu : [Pukul] WIB — sesuai sesi\n" +
      "Tempat : [Ruang/Alamat]\n" +
      "Agenda : Wawancara dengan KPM\n" +
      "Jabatan : {{JABATAN}}\n\n" +
      "Pokok wawancara: visi, misi, dan komitmen terhadap pengembangan BUMD; pemahaman terhadap tugas dan tanggung jawab jabatan; integritas, kepemimpinan, kompetensi, dan dedikasi; strategi pencapaian target kinerja dan penyelesaian permasalahan BUMD; komitmen terhadap tata kelola perusahaan yang baik dan kepatuhan terhadap ketentuan.\n\n" +
      "Peserta wajib hadir tepat waktu, berpakaian [ketentuan], membawa identitas diri, dan mempersiapkan dokumen/bahan pendukung yang diperlukan.\n\n" +
      "Demikian undangan ini disampaikan. Atas perhatian dan kerja sama Saudara/i, disampaikan terima kasih.",
  },
  {
    id: "psrt-hasil-akhir", nama: "Pemberitahuan Hasil Akhir Seleksi kepada Peserta", kategori: "Surat Kepada Peserta",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Sifat : Penting\nKepada Yth. : {{NAMA_PESERTA}} [di Tempat]\n\n" +
      "Berdasarkan hasil seluruh tahapan {{JABATAN}} pada {{BUMD}} Tahun [tahun], Panitia Seleksi telah menetapkan hasil akhir berdasarkan Berita Acara Nomor [..] tanggal [..] dan ketentuan Juklak/Juknis.\n\n" +
      "Hasil Seleksi:\n" +
      "Nama/Kode Peserta : {{NAMA_PESERTA}}\n" +
      "Jabatan : {{JABATAN}}\n" +
      "Nilai Akhir : [...]\n" +
      "Peringkat : [...]\n" +
      "Status/Rekomendasi : [Terpilih/Direkomendasikan/Tidak Terpilih sesuai ketentuan]\n\n" +
      "Ketentuan: hasil akhir merupakan hasil penilaian seluruh tahapan sesuai Juklak/Juknis; penetapan dan pengangkatan dilaksanakan oleh pejabat/KPM yang berwenang sesuai peraturan perundang-undangan; peserta yang dinyatakan terpilih wajib mengikuti proses administrasi dan tahapan lanjutan yang ditetapkan; apabila ditemukan ketidakbenaran dokumen atau informasi yang memengaruhi hasil, tindak lanjut dilakukan sesuai ketentuan.\n\n" +
      "Demikian pemberitahuan ini disampaikan untuk diketahui dan dipergunakan sebagaimana mestinya.",
  },

  // ────────────────────────────────────────────────────────────────────
  // LAINNYA — naskah pelengkap (tidak berasal dari paket naskah_surat,
  // dipertahankan dari versi sebelumnya karena tetap dibutuhkan)
  // ────────────────────────────────────────────────────────────────────
  {
    id: "lt-surat-tugas", nama: "Surat Tugas", kategori: "Lainnya",
    layout: "judul", judulDinas: "SURAT TUGAS",
    tentang: "PELAKSANAAN UJI KOMPETENSI DAN KELAYAKAN {{JABATAN}} PADA {{BUMD}}",
    signature: SIG_SINGLE,
    template:
      "Berdasarkan {{DASAR_HUKUM}}, {{PANITIA}} dengan ini menugaskan Tim Uji Kompetensi dan Kelayakan (Tim UKK) untuk melaksanakan Uji Kompetensi dan Kelayakan (UKK) terhadap calon {{JABATAN}} pada {{BUMD}} periode {{PERIODE}}, dengan ketentuan sebagai berikut:\n\n" +
      "1. Melaksanakan tugas dengan penuh tanggung jawab, objektif, dan sesuai dengan kode etik yang berlaku;\n" +
      "2. Menyampaikan hasil pelaksanaan tugas kepada {{PANITIA}} dalam bentuk Berita Acara;\n" +
      "3. Surat tugas ini berlaku sejak tanggal ditetapkan sampai dengan tahapan dimaksud selesai dilaksanakan.\n\n" +
      "Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.",
  },
  {
    id: "lt-pakta", nama: "Pakta Integritas", kategori: "Lainnya",
    layout: "judul", judulDinas: "PAKTA INTEGRITAS",
    signature: SIG_PESERTA,
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
    id: "lt-rekomendasi", nama: "Rekomendasi", kategori: "Lainnya",
    layout: "korespondensi", signature: SIG_SINGLE,
    template:
      "Berdasarkan hasil pelaksanaan Uji Kompetensi dan Kelayakan (UKK) sesuai dengan {{DASAR_HUKUM}}, {{PANITIA}} dengan ini merekomendasikan:\n\n" +
      "Nama : {{NAMA_PESERTA}}\n\n" +
      "sebagai calon {{JABATAN}} pada {{BUMD}} periode {{PERIODE}} untuk diproses lebih lanjut sesuai dengan ketentuan yang berlaku.\n\n" +
      "Demikian surat rekomendasi ini dibuat untuk dipergunakan sebagaimana mestinya.",
  },
  {
    id: "lt-keputusan", nama: "Keputusan", kategori: "Lainnya",
    layout: "judul", judulDinas: "KEPUTUSAN {{PANITIA}}",
    tentang: "PENETAPAN {{NAMA_PESERTA}} SEBAGAI {{JABATAN}} PADA {{BUMD}} PERIODE {{PERIODE}}",
    signature: SIG_SINGLE,
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
    id: "lt-penetapan", nama: "Penetapan", kategori: "Lainnya",
    layout: "judul", judulDinas: "PENETAPAN",
    tentang: "{{NAMA_PESERTA}} SEBAGAI {{JABATAN}} PADA {{BUMD}}",
    signature: SIG_SINGLE,
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

/** Naskah dinas kustom yang dibuat Panitia dari kosong (lihat migration
 * 0010: letters.custom_judul/custom_tentang/custom_layout/custom_signature).
 * jenis_surat pada baris letters yang bersangkutan bernilai literal
 * "custom" untuk menandai ini. */
export type CustomLetterFields = {
  nama_surat: string;
  custom_judul: string | null;
  custom_tentang: string | null;
  custom_layout: string | null;
  custom_signature: string | null;
};

export const CUSTOM_TEMPLATE_ID = "custom";

/** Resolves the LetterTemplate to render for a saved letter row — either a
 * fixed catalog entry (findTemplate), or a synthetic one built from the
 * letter's own custom_* columns when jenis_surat === "custom". Every
 * renderer (cetak/pdf/docx/preview) should go through this instead of
 * calling findTemplate() directly, so naskah kustom render identically
 * everywhere. */
export function resolveTemplate(letter: { jenis_surat: string } & Partial<CustomLetterFields>): LetterTemplate | undefined {
  if (letter.jenis_surat !== CUSTOM_TEMPLATE_ID) return findTemplate(letter.jenis_surat);
  const layout = (letter.custom_layout as LetterLayout) || "korespondensi";
  const sigKind = (letter.custom_signature as SignatureSpec["kind"]) || "single";
  return {
    id: CUSTOM_TEMPLATE_ID,
    nama: letter.nama_surat || "Naskah Kustom",
    kategori: "Kustom",
    layout,
    judulDinas: letter.custom_judul || letter.nama_surat || "NASKAH DINAS",
    tentang: letter.custom_tentang || undefined,
    signature: { kind: sigKind },
    template: "",
  };
}

/** Kategori dalam urutan tampil pada Generator Surat, mengikuti struktur paket naskah_surat. */
export const LETTER_CATEGORIES = [
  "Berita Acara", "Pengumuman", "Surat Internal Panitia", "Surat Kepada Peserta", "Lainnya",
] as const;

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
