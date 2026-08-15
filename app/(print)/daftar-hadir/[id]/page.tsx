import { createClient } from "@/lib/supabase/server";
import { kopBannerAssetFor } from "@/lib/letter-format";
import { fetchSignatureData, type Signer } from "@/lib/letter-signature";
import { fmtTanggalPanjang } from "@/lib/letter-templates";
import PrintButton from "@/components/PrintButton";

// Lampiran L-01 pada paket naskah dinas — Daftar Hadir rapat/kegiatan
// seleksi. Panitia/Sekretariat, Tim UKK, dan (bila ada) KPM yang sudah
// terdaftar di seleksi ini diisi otomatis (Nama, Jabatan/Unsur); baris
// kosong di bawahnya untuk peserta/tamu yang hadir mengisi & tanda tangan
// langsung saat kegiatan berlangsung.
export default async function DaftarHadirPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: sheet } = await supabase
    .from("attendance_sheets")
    .select("*, selections(jabatan, bumds(nama))")
    .eq("id", id)
    .single();
  if (!sheet) return <div className="p-8">Daftar Hadir tidak ditemukan.</div>;

  const bumdNama: string = (sheet as any).selections?.bumds?.nama || "-";
  const jabatan: string = (sheet as any).selections?.jabatan || "-";
  const kopUrl = kopBannerAssetFor(bumdNama);
  const sig = await fetchSignatureData(supabase, sheet.selection_id);

  const known: { nama: string; unsur: string }[] = [
    sig.ketua && { nama: sig.ketua.nama, unsur: "Ketua Panitia Seleksi" },
    sig.sekretaris && { nama: sig.sekretaris.nama, unsur: "Sekretaris Panitia Seleksi" },
    ...sig.anggota.map((a: Signer) => ({ nama: a.nama, unsur: "Anggota Panitia Seleksi" })),
    ...sig.timUkk.map((a: Signer) => ({ nama: a.nama, unsur: "Tim Uji Kelayakan dan Kepatutan" })),
  ].filter(Boolean) as { nama: string; unsur: string }[];

  const blankRows = Array.from({ length: sheet.baris_kosong ?? 10 });

  return (
    <>
      <style>{`
        @page { size: A4; margin: 1.5cm 2cm 2cm 2.5cm; }
        .naskah { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; }
        .naskah .kop { border-bottom:1.5pt solid #222; padding-bottom:8px; margin-bottom:8px; text-align:center; }
        .naskah .kop img { width:100%; height:auto; display:block; }
        .naskah .judul-blok { text-align:center; margin: 1.2em 0 1.2em; }
        .naskah .judul-blok .judul { font-weight:700; text-decoration:underline; text-transform:uppercase; font-size: 13pt; }
        .naskah .meta { margin-bottom: 1em; }
        .naskah .meta div { margin-bottom: 2px; }
        .naskah table.hadir { width:100%; border-collapse: collapse; margin-top: 8px; }
        .naskah table.hadir th, .naskah table.hadir td { border: 1px solid #333; padding: 6px 8px; text-align:left; vertical-align: middle; font-size: 10.5pt; }
        .naskah table.hadir th { font-weight: 700; text-align: center; background: #f3f4f6; }
        .naskah table.hadir td.no { text-align: center; width: 5%; }
        .naskah table.hadir td.ttd { width: 16%; }
        @media print { .no-print { display:none !important; } body { margin:0; } }
      `}</style>
      <div className="no-print p-4 bg-navy-900 text-white flex items-center justify-between">
        <div className="text-sm">Pratinjau cetak Daftar Hadir.</div>
        <PrintButton />
      </div>
      <div className="naskah" style={{ maxWidth: "21cm", margin: "0 auto", padding: "1.5cm 2cm 2cm 2.5cm" }}>
        <div className="kop"><img src={kopUrl} alt={`Kop Surat ${bumdNama}`} /></div>
        <div className="judul-blok"><div className="judul">Daftar Hadir</div></div>
        <div className="meta">
          <div>Kegiatan &nbsp;: {sheet.judul_kegiatan}</div>
          <div>Dalam rangka : {jabatan} pada {bumdNama}</div>
          <div>Hari/Tanggal : {fmtTanggalPanjang(sheet.tanggal)}</div>
          {sheet.tempat && <div>Tempat &nbsp;&nbsp;&nbsp;: {sheet.tempat}</div>}
        </div>
        <table className="hadir">
          <thead>
            <tr>
              <th className="no">No</th>
              <th>Nama</th>
              <th>Jabatan / Unsur</th>
              <th>Instansi</th>
              <th>Tanda Tangan</th>
            </tr>
          </thead>
          <tbody>
            {known.map((row, i) => (
              <tr key={`k-${i}`}>
                <td className="no">{i + 1}</td>
                <td>{row.nama}</td>
                <td>{row.unsur}</td>
                <td>Panitia Seleksi</td>
                <td className="ttd">&nbsp;</td>
              </tr>
            ))}
            {blankRows.map((_, i) => (
              <tr key={`b-${i}`}>
                <td className="no">{known.length + i + 1}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td className="ttd">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
