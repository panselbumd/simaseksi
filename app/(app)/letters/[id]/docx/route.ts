import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { createClient } from "@/lib/supabase/server";
import {
  PAGE_MARGIN_TWIP, FONT_FAMILY, FONT_SIZE_HALF_PT, LINE_SPACING_DOCX,
  kopBannerAssetFor, kopBannerAspectRatioFor,
} from "@/lib/letter-format";
import { findTemplate, letterDataFrom, letterHeaderFor, splitParagraphs } from "@/lib/letter-templates";
import { fetchSignatureData, signerNameOr, signerNipLine, type Signer } from "@/lib/letter-signature";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: letter } = await supabase
    .from("letters")
    .select("*, selections(jabatan, dasar_hukum, bumds(nama, kop_image_path, alamat))")
    .eq("id", id)
    .single();
  if (!letter) return new NextResponse("Not found", { status: 404 });

  const bumd = (letter as any).selections?.bumds;
  const bumdNama: string = bumd?.nama || "-";

  const tpl = findTemplate(letter.jenis_surat);
  const data = letterDataFrom(letter, bumdNama);
  const header = tpl ? letterHeaderFor(tpl, data) : null;
  const paragraphs = splitParagraphs(letter.isi || "");
  const sigKind = tpl?.signature.kind ?? "single";
  const sig = await fetchSignatureData(supabase, (letter as any).selection_id);
  const anggotaRows: (Signer | null)[] = [sig.anggota[0] ?? null, sig.anggota[1] ?? null, sig.anggota[2] ?? null];
  const table5Rows = [
    { jabatan: "Ketua Pansel", signer: sig.ketua },
    { jabatan: "Sekretariat Pansel", signer: sig.sekretaris },
    { jabatan: "Anggota", signer: anggotaRows[0] },
    { jabatan: "Anggota", signer: anggotaRows[1] },
    { jabatan: "Anggota", signer: anggotaRows[2] },
  ];

  // Always the bundled official letterhead banner, read straight off disk
  // (see lib/letter-format.ts for why we don't read bumds.kop_image_path /
  // Supabase Storage here).
  let kopImage: Buffer | null = null;
  try {
    kopImage = await readFile(path.join(process.cwd(), "public", kopBannerAssetFor(bumdNama)));
  } catch {
    // Letter still generates without the banner if the asset is missing.
  }

  const spacing = { line: LINE_SPACING_DOCX, lineRule: "auto" as const };
  const run = (text: string, opts: Record<string, unknown> = {}) =>
    new TextRun({ text, font: FONT_FAMILY, size: FONT_SIZE_HALF_PT, ...opts });

  // A block of text with single \n hard line breaks (e.g. the
  // Hari/Tanggal/Waktu/Tempat block in Undangan) becomes ONE Paragraph
  // with explicit line-break runs between each line, so it stays visually
  // together without the extra spacing a new Paragraph would add.
  function bodyParagraph(block: string, opts: { justify?: boolean; bold?: boolean } = {}) {
    const lines = block.split("\n");
    const children: TextRun[] = [];
    lines.forEach((line, i) => {
      if (i > 0) children.push(new TextRun({ break: 1 }));
      children.push(run(line, opts.bold ? { bold: true } : {}));
    });
    return new Paragraph({
      alignment: opts.justify ? AlignmentType.JUSTIFIED : undefined,
      spacing,
      children,
    });
  }

  // Page text width = A4 (21cm) minus left/right margins, converted cm -> px
  // at 96dpi for the ImageRun transformation.
  const PAGE_WIDTH_CM = 21;
  const usableWidthCm = PAGE_WIDTH_CM - PAGE_MARGIN_TWIP.left / 566.929 - PAGE_MARGIN_TWIP.right / 566.929;
  const kopImgWidthPx = Math.round((usableWidthCm / 2.54) * 96);
  const kopImgHeightPx = Math.round(kopImgWidthPx / kopBannerAspectRatioFor(bumdNama));

  const kopParagraphs: Paragraph[] = [];
  if (kopImage) {
    kopParagraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 4, color: "222222" } },
      children: [new ImageRun({ data: kopImage, transformation: { width: kopImgWidthPx, height: kopImgHeightPx }, type: "jpg" })],
    }));
  }
  kopParagraphs.push(
    // Jarak kop surat ke isi surat: 1,5 spasi.
    new Paragraph({ spacing, children: [run("")] }),
  );

  const headerParagraphs: Paragraph[] = header
    ? [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing, children: [run(header.judul, { bold: true, underline: {} })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing, children: [run(`NOMOR: ${letter.nomor}`)] }),
        ...(header.tentang
          ? [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing, children: [run("TENTANG")] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing, children: [run(header.tentang, { bold: true })] }),
            ]
          : []),
        new Paragraph({ spacing, children: [run("")] }),
      ]
    : [
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing, children: [run(`Kota Batu, ${data.TANGGAL}`)] }),
        new Paragraph({ spacing, children: [run(`Nomor  : ${letter.nomor}`)] }),
        new Paragraph({ spacing, children: [run(`Perihal : ${letter.nama_surat}`)] }),
        new Paragraph({ spacing, children: [run("")] }),
      ];

  const bodyParagraphs = paragraphs.map((p) => bodyParagraph(p, { justify: true }));

  const closingParagraphs: Paragraph[] = header
    ? [
        new Paragraph({ spacing, children: [run("")] }),
        bodyParagraph(`Ditetapkan di Kota Batu\npada tanggal ${data.TANGGAL}`),
      ]
    : [];

  // "single"/"peserta": satu blok, sisi kanan halaman, teks rata kiri di
  // dalam blok — dibungkus tabel 2 kolom tanpa border agar posisinya tetap
  // di kanan tanpa memengaruhi perataan teks di dalamnya.
  const signatureCellChildren = sigKind === "peserta"
    ? [
        new Paragraph({ alignment: AlignmentType.LEFT, spacing, children: [run("Yang membuat pernyataan,")] }),
        new Paragraph({ children: [run("")] }),
        new Paragraph({ children: [run("")] }),
        new Paragraph({ children: [run("")] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [run(`( ${data.NAMA_PESERTA} )`, { bold: true, underline: {} })] }),
      ]
    : [
        new Paragraph({ alignment: AlignmentType.LEFT, spacing, children: [run(`${data.PANITIA},`)] }),
        new Paragraph({ children: [run("")] }),
        new Paragraph({ children: [run("")] }),
        new Paragraph({ children: [run("")] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [run(`( ${signerNameOr(sig.ketua)} )`, { bold: true, underline: {} })] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [run("Ketua Panitia Seleksi")] }),
        new Paragraph({ alignment: AlignmentType.LEFT, children: [run(signerNipLine(sig.ketua))] }),
      ];

  const THIN_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "333333" } as const;
  const cell = (children: Paragraph[], opts: { width?: number; center?: boolean } = {}) =>
    new TableCell({
      width: { size: opts.width ?? 100, type: WidthType.PERCENTAGE },
      borders: { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER },
      children,
    });
  const p = (text: string, opts: { bold?: boolean; underline?: boolean; center?: boolean } = {}) =>
    new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : undefined,
      spacing,
      children: [run(text, { bold: opts.bold, underline: opts.underline ? {} : undefined })],
    });

  // table5: Ketua/Sekretaris/Anggota1-3 menandatangani individual, satu
  // baris per orang, dalam tabel penuh lebar halaman.
  const table5 = sigKind === "table5"
    ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            cell([p("No", { bold: true, center: true })], { width: 8 }),
            cell([p("Nama", { bold: true, center: true })], { width: 37 }),
            cell([p("Jabatan", { bold: true, center: true })], { width: 30 }),
            cell([p("Tanda Tangan", { bold: true, center: true })], { width: 25 }),
          ]}),
          ...table5Rows.map((row, i) => new TableRow({ children: [
            cell([p(String(i + 1), { center: true })], { width: 8 }),
            cell([p(signerNameOr(row.signer))], { width: 37 }),
            cell([p(row.jabatan)], { width: 30 }),
            cell([p(" ")], { width: 25 }),
          ]})),
        ],
      })
    : null;

  // block3: Ketua / Sekretaris / Anggota, masing-masing Nama+NIP, dalam
  // satu baris 3 kolom.
  const block3 = sigKind === "block3"
    ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          cell([
            p("KETUA PANITIA SELEKSI", { bold: true, center: true }),
            p(""), p(""), p(""),
            p(signerNameOr(sig.ketua), { bold: true, underline: true, center: true }),
            p(signerNipLine(sig.ketua), { center: true }),
          ], { width: 33 }),
          cell([
            p("SEKRETARIS PANITIA SELEKSI", { bold: true, center: true }),
            p(""), p(""), p(""),
            p(signerNameOr(sig.sekretaris), { bold: true, underline: true, center: true }),
            p(signerNipLine(sig.sekretaris), { center: true }),
          ], { width: 33 }),
          cell([
            p("ANGGOTA/PEJABAT TERKAIT", { bold: true, center: true }),
            p(""), p(""), p(""),
            p(signerNameOr(sig.anggota[0] ?? null), { bold: true, underline: true, center: true }),
            p(signerNipLine(sig.anggota[0] ?? null), { center: true }),
          ], { width: 34 }),
        ]})],
      })
    : null;

  // "single"/"peserta": blok kanan halaman dibungkus tabel 2 kolom tanpa
  // border agar posisinya tetap di kanan tanpa memengaruhi perataan teks
  // di dalamnya.
  const singleOrPesertaTable = (sigKind === "single" || sigKind === "peserta")
    ? new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
        rows: [new TableRow({
          children: [
            new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [run("")] })] }),
            new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: signatureCellChildren }),
          ],
        })],
      })
    : null;

  const signatureTable = table5 ?? block3 ?? singleOrPesertaTable!;

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN_TWIP } },
      children: [
        ...kopParagraphs,
        ...headerParagraphs,
        ...bodyParagraphs,
        ...closingParagraphs,
        new Paragraph({ spacing, children: [run("")] }),
        new Paragraph({ spacing, children: [run("")] }),
        signatureTable,
      ],
    }],
  });

  const buf = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${letter.nama_surat}-${String(letter.nomor).replace(/[\\/]/g, "_")}.docx"`,
    },
  });
}
