// Single source of truth for the government tata naskah dinas formatting
// rules SIMASEKSI's letters must follow, so the .docx export, the .pdf
// export, and the on-screen print view can never drift out of sync:
//
//   - Font Arial, 11pt
//   - Margins: atas 1.5cm / kiri 2.5cm / bawah 2cm / kanan 2cm
//   - Spasi baris 1.5
//   - Perataan naskah: justify (rata kiri-kanan)
//   - Jarak kop surat ke isi surat: 1.5 spasi
//   - Blok tanda tangan: sisi kanan halaman, teks di dalamnya rata kiri

export const CM_TO_TWIP = 566.929; // 1440 twip/inch ÷ 2.54 cm/inch

export const PAGE_MARGIN_CM = { top: 1.5, left: 2.5, bottom: 2, right: 2 } as const;

export const PAGE_MARGIN_TWIP = {
  top: Math.round(PAGE_MARGIN_CM.top * CM_TO_TWIP),     // 850
  left: Math.round(PAGE_MARGIN_CM.left * CM_TO_TWIP),   // 1417
  bottom: Math.round(PAGE_MARGIN_CM.bottom * CM_TO_TWIP), // 1134
  right: Math.round(PAGE_MARGIN_CM.right * CM_TO_TWIP),   // 1134
};

export const FONT_FAMILY = "Arial";
export const FONT_SIZE_PT = 11;
export const FONT_SIZE_HALF_PT = FONT_SIZE_PT * 2; // docx `size` is in half-points

export const LINE_SPACING_MULTIPLIER = 1.5;
export const LINE_SPACING_DOCX = Math.round(240 * LINE_SPACING_MULTIPLIER); // 360 (240 = single)

// Signature block: positioned in the right ~45% of the text width; text
// inside that block is left-aligned (rata kiri), not centered.
export const SIGNATURE_BLOCK_WIDTH_PERCENT = 45;

export const DEFAULT_KOP_ALAMAT = "Jalan Panglima Sudirman Nomor 507, Kota Batu, Kode Pos 65313";

// Perumda (Perumdam Among Tirto) uses "Dewan Pengawas" nomenclature; PT
// entities (PT. Batu Wisata Resource) use "Komisaris" — mirrors index.html's
// hardcoded bumd.id check, generalized so it doesn't depend on prototype ids.
export function kopTitleFor(bumdNama: string): string {
  return bumdNama.toLowerCase().includes("perumda")
    ? "PANITIA SELEKSI CALON DIREKSI DAN CALON DEWAN PENGAWAS"
    : "PANITIA SELEKSI CALON DIREKSI DAN CALON KOMISARIS";
}
