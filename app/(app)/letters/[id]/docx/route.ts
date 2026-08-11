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
import { fmtTanggalPanjang } from "@/lib/letter-templates";

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
  const panitiaLabel = `Panitia Seleksi ${letter.jabatan ?? ""} ${bumdNama}`.trim();

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

  const doc = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN_TWIP } },
      children: [
        ...kopParagraphs,
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing, children: [run(`Kota Batu, ${fmtTanggalPanjang(letter.tanggal)}`)] }),
        new Paragraph({ spacing, children: [run(`Nomor  : ${letter.nomor}`)] }),
        new Paragraph({ spacing, children: [run(`Perihal : ${letter.nama_surat}`)] }),
        new Paragraph({ spacing, children: [run("")] }),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing, children: [run(letter.isi)] }),
        new Paragraph({ spacing, children: [run("")] }),
        new Paragraph({ spacing, children: [run("")] }),
        // Blok tanda tangan: sisi kanan halaman, teks di dalam blok rata kiri.
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
          rows: [new TableRow({
            children: [
              new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [run("")] })] }),
              new TableCell({
                width: { size: 45, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.LEFT, spacing, children: [run(`${panitiaLabel},`)] }),
                  new Paragraph({ children: [run("")] }),
                  new Paragraph({ children: [run("")] }),
                  new Paragraph({ children: [run("")] }),
                  new Paragraph({ alignment: AlignmentType.LEFT, children: [run("( ................................................ )", { bold: true, underline: {} })] }),
                  new Paragraph({ alignment: AlignmentType.LEFT, children: [run("Ketua Panitia Seleksi")] }),
                ],
              }),
            ],
          })],
        }),
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
