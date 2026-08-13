import { createClient } from "@/lib/supabase/server";
import { findTemplate, letterDataFrom, letterHeaderFor, splitParagraphs } from "@/lib/letter-templates";
import { kopBannerAssetFor } from "@/lib/letter-format";
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

  const tpl = findTemplate(letter.jenis_surat);
  const data = letterDataFrom(letter, bumdNama);
  const header = tpl ? letterHeaderFor(tpl, data) : null;
  const paragraphs = splitParagraphs(letter.isi || "");
  const signatureRole = tpl?.signatureRole ?? "panitia";

  return (
    <>
      <style>{`
        @page { size: A4; margin: 1.5cm 2cm 2cm 2.5cm; }
        .naskah { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; text-align: justify; }
        .naskah .kop { border-bottom:1.5pt solid #222; padding-bottom:8px; margin-bottom:8px; text-align:center; }
        .naskah .kop img { width:100%; height:auto; display:block; }
        .naskah .kop-gap { margin-bottom: 1.5em; }
        .naskah .judul-blok { text-align:center; margin-bottom: 1.5em; }
        .naskah .judul-blok .judul { font-weight:700; text-decoration:underline; text-transform:uppercase; }
        .naskah .judul-blok .tentang-label { margin-top: 4px; }
        .naskah .judul-blok .tentang { font-weight:700; text-transform:uppercase; }
        .naskah p { white-space: pre-line; margin-bottom: 1em; }
        .naskah .ttd { margin-left:55%; width:45%; text-align:left; margin-top:34px; }
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

        <div className="ttd">
          {signatureRole === "peserta" ? (
            <>
              <p>Yang membuat pernyataan,</p>
              <p style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( {data.NAMA_PESERTA} )</p>
            </>
          ) : (
            <>
              <p>{data.PANITIA},</p>
              <p style={{ marginTop: 55, fontWeight: 700, textDecoration: "underline" }}>( ................................................ )</p>
              <p>Ketua Panitia Seleksi</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
