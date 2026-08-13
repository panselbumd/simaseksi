import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, Page, Text, View, Image, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PAGE_MARGIN_CM, kopBannerAssetFor } from "@/lib/letter-format";
import { findTemplate, letterDataFrom, letterHeaderFor, splitParagraphs } from "@/lib/letter-templates";

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

  const tpl = findTemplate(letter.jenis_surat);
  const data = letterDataFrom(letter, bumdNama);
  const header = tpl ? letterHeaderFor(tpl, data) : null;
  const paragraphs = splitParagraphs(letter.isi || "");
  const signatureRole = tpl?.signatureRole ?? "panitia";

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

        <View style={styles.signatureBlock}>
          {signatureRole === "peserta" ? (
            <>
              <Text>Yang membuat pernyataan,</Text>
              <Text style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( {data.NAMA_PESERTA} )</Text>
            </>
          ) : (
            <>
              <Text>{data.PANITIA},</Text>
              <Text style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( ................................................ )</Text>
              <Text>Ketua Panitia Seleksi</Text>
            </>
          )}
        </View>
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
