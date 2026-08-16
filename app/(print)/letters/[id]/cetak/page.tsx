import { createClient } from "@/lib/supabase/server";
import { resolveTemplate, letterDataFrom, letterHeaderFor, splitParagraphs } from "@/lib/letter-templates";
import { kopBannerAssetFor } from "@/lib/letter-format";
import { fetchSignatureData, signerNameOr, signerNipLine, type Signer } from "@/lib/letter-signature";
import PrintButton from "@/components/PrintButton";

export default async function LetterPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: letter } = await supabase
    .from("letters")
    .select("*, selections(jabatan, dasar_hukum, bumds(nama, kop_image_path, alamat))")
    .eq("id", id)
    .single();
  if (!letter) return <div className="p-8">Surat tidak ditemukan.</div>;

  const bumd = (letter as any).selections?.bumds;
  const bumdNama: string = bumd?.nama || "-";
  const kopUrl = kopBannerAssetFor(bumdNama);

  const tpl = resolveTemplate(letter as any);
  const data = letterDataFrom(letter, bumdNama);
  const header = tpl ? letterHeaderFor(tpl, data) : null;
  const paragraphs = splitParagraphs(letter.isi || "");
  const sigKind = tpl?.signature.kind ?? "single";
  const sig = await fetchSignatureData(supabase, letter.selection_id);

  // table5: Ketua, Sekretaris, lalu hingga 3 Anggota — placeholder titik-titik
  // bila jumlah anggota terdaftar untuk seleksi ini kurang dari 3.
  const anggotaRows: (Signer | null)[] = [sig.anggota[0] ?? null, sig.anggota[1] ?? null, sig.anggota[2] ?? null];
  const table5Rows = [
    { jabatan: "Ketua Pansel", signer: sig.ketua },
    { jabatan: "Sekretariat Pansel", signer: sig.sekretaris },
    { jabatan: "Anggota", signer: anggotaRows[0] },
    { jabatan: "Anggota", signer: anggotaRows[1] },
    { jabatan: "Anggota", signer: anggotaRows[2] },
  ];

  return (
    <>
      <style>{`
        @page { size: A4; margin: 1.5cm 2cm 2cm 2.5cm; }
        .naskah { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; text-align: justify; }
        .naskah .kop { padding-bottom:8px; margin-bottom:8px; text-align:center; }
        .naskah .kop img { width:100%; height:auto; display:block; }
        .naskah .kop-gap { margin-bottom: 1.5em; }
        .naskah .judul-blok { text-align:center; margin-bottom: 1.5em; }
        .naskah .judul-blok .judul { font-weight:700; text-decoration:underline; text-transform:uppercase; }
        .naskah .judul-blok .tentang-label { margin-top: 4px; }
        .naskah .judul-blok .tentang { font-weight:700; text-transform:uppercase; }
        .naskah p { white-space: pre-line; margin-bottom: 1em; }
        .naskah .ttd { margin-left:55%; width:45%; text-align:left; margin-top:34px; }
        .naskah .ttd5 { width:100%; margin-top: 24px; border-collapse: collapse; }
        .naskah .ttd5 td, .naskah .ttd5 th { border: 1px solid #333; padding: 6px 8px; text-align:left; vertical-align: top; }
        .naskah .ttd5 th { font-weight: 700; text-align: center; }
        .naskah .ttd3 { width:100%; margin-top: 24px; border-collapse: collapse; }
        .naskah .ttd3 td { border: 1px solid #333; padding: 8px; text-align:center; vertical-align: top; width: 33.33%; }
        .naskah .ttd3 .jabatan-label { font-weight: 700; text-transform: uppercase; margin-bottom: 44px; display: block; }
        .naskah .ttd3 .nama { font-weight: 700; text-decoration: underline; }
        @media print { .no-print { display:none !important; } body { margin:0; } }
      `}</style>
      <div className="no-print p-4 bg-navy-900 text-white flex items-center justify-between">
        <div className="text-sm">Pratinjau cetak — margin &amp; font mengikuti tata naskah dinas.</div>
        <PrintButton />
      </div>
      <div className="naskah" style={{ maxWidth: "21cm", margin: "0 auto", padding: "1.5cm 2cm 2cm 2.5cm" }}>
        <div className="kop">
          <img src={kopUrl} alt={`Kop Surat ${bumdNama}`} />
        </div>
        <div className="kop-gap" />

        {header ? (
          <div className="judul-blok">
            <div className="judul">{header.judul}</div>
            <div>NOMOR: {letter.nomor}</div>
            {header.tentang && (
              <>
                <div className="tentang-label">TENTANG</div>
                <div className="tentang">{header.tentang}</div>
              </>
            )}
          </div>
        ) : (
          <>
            <p style={{ textAlign: "right" }}>Kota Batu, {data.TANGGAL}</p>
            <p style={{ marginBottom: 4 }}>Nomor &nbsp;: {letter.nomor}</p>
            <p style={{ marginBottom: 18 }}>Perihal : {letter.nama_surat}</p>
          </>
        )}

        {paragraphs.map((para, i) => <p key={i}>{para}</p>)}

        {header && (
          <p style={{ marginTop: "1em" }}>Ditetapkan di Kota Batu{"\n"}pada tanggal {data.TANGGAL}</p>
        )}

        {sigKind === "peserta" && (
          <div className="ttd">
            <p>Yang membuat pernyataan,</p>
            <p style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( {data.NAMA_PESERTA} )</p>
          </div>
        )}

        {sigKind === "single" && (
          <div className="ttd">
            <p>{data.PANITIA},</p>
            <p style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( {signerNameOr(sig.ketua)} )</p>
            <p>Ketua Panitia Seleksi</p>
            <p>{signerNipLine(sig.ketua)}</p>
          </div>
        )}

        {sigKind === "table5" && (
          <table className="ttd5">
            <thead>
              <tr><th style={{ width: "6%" }}>No</th><th style={{ width: "34%" }}>Nama</th><th style={{ width: "30%" }}>Jabatan</th><th>Tanda Tangan</th></tr>
            </thead>
            <tbody>
              {table5Rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ textAlign: "center" }}>{i + 1}</td>
                  <td>{signerNameOr(row.signer)}</td>
                  <td>{row.jabatan}</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {sigKind === "block3" && (
          <table className="ttd3">
            <tbody>
              <tr>
                <td>
                  <span className="jabatan-label">Ketua Panitia Seleksi</span>
                  <div className="nama">{signerNameOr(sig.ketua)}</div>
                  <div>{signerNipLine(sig.ketua)}</div>
                </td>
                <td>
                  <span className="jabatan-label">Sekretaris Panitia Seleksi</span>
                  <div className="nama">{signerNameOr(sig.sekretaris)}</div>
                  <div>{signerNipLine(sig.sekretaris)}</div>
                </td>
                <td>
                  <span className="jabatan-label">Anggota/Pejabat Terkait</span>
                  <div className="nama">{signerNameOr(sig.anggota[0] ?? null)}</div>
                  <div>{signerNipLine(sig.anggota[0] ?? null)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
