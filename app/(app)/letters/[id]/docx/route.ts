import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";
import { createClient } from "@/lib/supabase/server";
import { PAGE_MARGIN_TWIP, FONT_FAMILY, FONT_SIZE_HALF_PT, LINE_SPACING_DOCX } from "@/lib/letter-format";
import { kopTitleFor, DEFAULT_KOP_ALAMAT } from "@/lib/letter-format";
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
  const kopTitle = kopTitleFor(bumdNama);
  const alamat = bumd?.alamat || DEFAULT_KOP_ALAMAT;
  const panitiaLabel = `Panitia Seleksi ${letter.jabatan ?? ""} ${bumdNama}`.trim();

  let kopImage: Buffer | null = null;
  if (bumd?.kop_image_path) {
    const { data: pub } = supabase.storage.from("kop-surat").getPublicUrl(bumd.kop_image_path);
    try {
      const res = await fetch(pub.publicUrl);
      if (res.ok) kopImage = Buffer.from(await res.arrayBuffer());
    } catch {
      // Letter still generates without the logo if Storage is unreachable.
    }
  }

  const spacing = { line: LINE_SPACING_DOCX, lineRule: "auto" as const };
  const run = (text: string, opts: Record<string, unknown> = {}) =>
    new TextRun({ text, font: FONT_FAMILY, size: FONT_SIZE_HALF_PT, ...opts });

  const kopParagraphs: Paragraph[] = [];
  if (kopImage) {
    kopParagraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: kopImage, transformation: { width: 60, height: 60 }, type: "png" })],
    }));
  }
  kopParagraphs.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run("PEMERINTAH KOTA BATU", { bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(kopTitle, { bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(bumdNama.toUpperCase(), { bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run("Sekretariat: Bagian Perekonomian dan Sumber Daya Alam", { size: FONT_SIZE_HALF_PT - 2 })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 4, color: "222222" } },
      children: [run(alamat, { size: FONT_SIZE_HALF_PT - 2 })],
    }),
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
