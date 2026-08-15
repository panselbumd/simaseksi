import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, Page, Text, View, Image, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PAGE_MARGIN_CM, kopBannerAssetFor } from "@/lib/letter-format";
import { resolveTemplate, letterDataFrom, letterHeaderFor, splitParagraphs } from "@/lib/letter-templates";
import { fetchSignatureData, signerNameOr, signerNipLine, type Signer } from "@/lib/letter-signature";

// Arial itself can't be bundled (proprietary), so we register Arimo — a
// metrically-compatible, open-license substitute purpose-built to match
// Arial's letterforms and spacing 1:1. Falls back to Helvetica if the font
// fetch fails at render time.
let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  try {
    Font.register({
      family: "Arimo",
      fonts: [
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/arimo@latest/latin-400-normal.ttf", fontWeight: 400 },
        { src: "https://cdn.jsdelivr.net/fontsource/fonts/arimo@latest/latin-700-normal.ttf", fontWeight: 700 },
      ],
    });
    fontRegistered = true;
  } catch {
    // renderToBuffer will fall back to Helvetica below if this never succeeds
  }
}

const CM_TO_PT = 28.3465;

function makeStyles(fontFamily: string) {
  return StyleSheet.create({
    page: {
      paddingTop: PAGE_MARGIN_CM.top * CM_TO_PT,
      paddingLeft: PAGE_MARGIN_CM.left * CM_TO_PT,
      paddingBottom: PAGE_MARGIN_CM.bottom * CM_TO_PT,
      paddingRight: PAGE_MARGIN_CM.right * CM_TO_PT,
      fontFamily,
      fontSize: 11,
      lineHeight: 1.5,
    },
    kopRow: { borderBottom: "1pt solid #333", paddingBottom: 8, marginBottom: 8 },
    kopImg: { width: "100%" },
    spacerLine: { marginBottom: 16 }, // ~1.5 line-height gap between kop & body
    right: { textAlign: "right", marginBottom: 12 },
    justify: { textAlign: "justify", marginBottom: 10 },
    judulBlok: { textAlign: "center", marginBottom: 16 },
    judul: { fontWeight: 700, textDecoration: "underline" },
    tentang: { fontWeight: 700 },
    signatureBlock: { marginTop: 30, marginLeft: "55%", width: "45%" },
    table5: { marginTop: 20, borderWidth: 1, borderColor: "#333" },
    table5Row: { flexDirection: "row" as const, borderBottomWidth: 1, borderColor: "#333" },
    table5RowLast: { flexDirection: "row" as const },
    table5CellNo: { width: "8%", padding: 5, borderRightWidth: 1, borderColor: "#333", textAlign: "center" as const },
    table5CellNama: { width: "37%", padding: 5, borderRightWidth: 1, borderColor: "#333" },
    table5CellJabatan: { width: "30%", padding: 5, borderRightWidth: 1, borderColor: "#333" },
    table5CellTtd: { width: "25%", padding: 5 },
    table5Header: { flexDirection: "row" as const, borderBottomWidth: 1, borderColor: "#333", fontWeight: 700 },
    table3: { marginTop: 20, flexDirection: "row" as const, borderWidth: 1, borderColor: "#333" },
    table3Cell: { width: "33.33%", padding: 8, borderRightWidth: 1, borderColor: "#333", textAlign: "center" as const },
    table3CellLast: { width: "33.33%", padding: 8, textAlign: "center" as const },
    table3Label: { fontWeight: 700, marginBottom: 44 },
    table3Nama: { fontWeight: 700, textDecoration: "underline" },
  });
}

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

  const tpl = resolveTemplate(letter as any);
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
  // (no network round-trip; see lib/letter-format.ts for why we don't read
  // bumds.kop_image_path / Supabase Storage here).
  let kopImageSrc: string | null = null;
  try {
    const assetPath = kopBannerAssetFor(bumdNama);
    const buf = await readFile(path.join(process.cwd(), "public", assetPath));
    kopImageSrc = `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    // Letter still generates without the banner if the asset is missing.
  }

  ensureFont();
  const styles = makeStyles(fontRegistered ? "Arimo" : "Helvetica");

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.kopRow}>
          {kopImageSrc && <Image src={kopImageSrc} style={styles.kopImg} />}
        </View>
        <View style={styles.spacerLine} />

        {header ? (
          <View style={styles.judulBlok}>
            <Text style={styles.judul}>{header.judul}</Text>
            <Text>NOMOR: {letter.nomor}</Text>
            {header.tentang && (
              <>
                <Text>TENTANG</Text>
                <Text style={styles.tentang}>{header.tentang}</Text>
              </>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.right}>Kota Batu, {data.TANGGAL}</Text>
            <Text>Nomor  : {letter.nomor}</Text>
            <Text style={{ marginBottom: 14 }}>Perihal : {letter.nama_surat}</Text>
          </>
        )}

        {paragraphs.map((para, i) => <Text key={i} style={styles.justify}>{para}</Text>)}

        {header && <Text style={{ marginBottom: 10 }}>{`Ditetapkan di Kota Batu\npada tanggal ${data.TANGGAL}`}</Text>}

        {sigKind === "peserta" && (
          <View style={styles.signatureBlock}>
            <Text>Yang membuat pernyataan,</Text>
            <Text style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( {data.NAMA_PESERTA} )</Text>
          </View>
        )}

        {sigKind === "single" && (
          <View style={styles.signatureBlock}>
            <Text>{data.PANITIA},</Text>
            <Text style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( {signerNameOr(sig.ketua)} )</Text>
            <Text>Ketua Panitia Seleksi</Text>
            <Text>{signerNipLine(sig.ketua)}</Text>
          </View>
        )}

        {sigKind === "table5" && (
          <View style={styles.table5}>
            <View style={styles.table5Header}>
              <Text style={styles.table5CellNo}>No</Text>
              <Text style={styles.table5CellNama}>Nama</Text>
              <Text style={styles.table5CellJabatan}>Jabatan</Text>
              <Text style={styles.table5CellTtd}>Tanda Tangan</Text>
            </View>
            {table5Rows.map((row, i) => (
              <View key={i} style={i === table5Rows.length - 1 ? styles.table5RowLast : styles.table5Row}>
                <Text style={styles.table5CellNo}>{i + 1}</Text>
                <Text style={styles.table5CellNama}>{signerNameOr(row.signer)}</Text>
                <Text style={styles.table5CellJabatan}>{row.jabatan}</Text>
                <Text style={styles.table5CellTtd}> </Text>
              </View>
            ))}
          </View>
        )}

        {sigKind === "block3" && (
          <View style={styles.table3}>
            <View style={styles.table3Cell}>
              <Text style={styles.table3Label}>KETUA PANITIA SELEKSI</Text>
              <Text style={styles.table3Nama}>{signerNameOr(sig.ketua)}</Text>
              <Text>{signerNipLine(sig.ketua)}</Text>
            </View>
            <View style={styles.table3Cell}>
              <Text style={styles.table3Label}>SEKRETARIS PANITIA SELEKSI</Text>
              <Text style={styles.table3Nama}>{signerNameOr(sig.sekretaris)}</Text>
              <Text>{signerNipLine(sig.sekretaris)}</Text>
            </View>
            <View style={styles.table3CellLast}>
              <Text style={styles.table3Label}>ANGGOTA/PEJABAT TERKAIT</Text>
              <Text style={styles.table3Nama}>{signerNameOr(sig.anggota[0] ?? null)}</Text>
              <Text>{signerNipLine(sig.anggota[0] ?? null)}</Text>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );

  const buf = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${letter.nama_surat}-${String(letter.nomor).replace(/[\\/]/g, "_")}.pdf"`,
    },
  });
}
