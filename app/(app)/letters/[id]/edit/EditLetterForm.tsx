"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LETTER_TEMPLATES, LETTER_CATEGORIES, fillTemplate, fmtTanggalPanjang, letterHeaderFor, splitParagraphs } from "@/lib/letter-templates";
import { signerNameOr, signerNipLine, type SignatureData } from "@/lib/letter-signature";
import { updateLetterAction } from "../../actions";

type LetterDraft = {
  id: string;
  jenis_surat: string;
  nomor: string;
  tanggal: string;
  nama_peserta: string;
  periode: string;
};

export default function EditLetterForm({
  letter, bumdNama, jabatan, dasarHukum, kopUrl, signature,
}: { letter: LetterDraft; bumdNama: string; jabatan: string; dasarHukum: string; kopUrl: string; signature: SignatureData }) {
  const router = useRouter();
  const [jenisId, setJenisId] = useState(letter.jenis_surat);
  const [nomor, setNomor] = useState(letter.nomor);
  const [tanggal, setTanggal] = useState(letter.tanggal);
  const [namaPeserta, setNamaPeserta] = useState(letter.nama_peserta);
  const [periode, setPeriode] = useState(letter.periode);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const tpl = LETTER_TEMPLATES.find((t) => t.id === jenisId) ?? LETTER_TEMPLATES[0];
  const sig = signature;

  const preview = useMemo(() => {
    const panitia = `Panitia Seleksi ${jabatan} ${bumdNama}`;
    const data: Record<string, string> = {
      NOMOR: nomor.trim() || "—/—/2026",
      TANGGAL: fmtTanggalPanjang(tanggal),
      BUMD: bumdNama,
      NAMA_PESERTA: namaPeserta.trim() || "[Nama Peserta]",
      JABATAN: jabatan,
      PERIODE: periode.trim() || "-",
      DASAR_HUKUM: dasarHukum || "—",
      PANITIA: panitia,
      TIM_UKK: "Tim Uji Kompetensi dan Kelayakan",
    };
    return { body: fillTemplate(tpl.template, data), panitia, data, header: letterHeaderFor(tpl, data) };
  }, [tpl, nomor, tanggal, namaPeserta, periode, jabatan, bumdNama, dasarHukum]);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    try {
      await updateLetterAction(letter.id, formData);
      setMsg({ type: "ok", text: "Perubahan tersimpan." });
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message || "Gagal menyimpan perubahan." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "340px 1fr" }}>
      <form action={handleSubmit} className="bg-white border border-gray-200 rounded-md p-5 space-y-3 h-fit">
        <div>
          <label className="block text-xs font-semibold mb-1">Jenis Surat</label>
          <select name="jenis_surat" value={jenisId} onChange={(e) => setJenisId(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            {LETTER_CATEGORIES.map((kategori) => (
              <optgroup key={kategori} label={kategori}>
                {LETTER_TEMPLATES.filter((t) => t.kategori === kategori).map((t) => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Nomor Surat</label>
          <input name="nomor" value={nomor} onChange={(e) => setNomor(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Tanggal</label>
          <input type="date" name="tanggal" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Peserta (opsional)</label>
          <input name="nama_peserta" value={namaPeserta} onChange={(e) => setNamaPeserta(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Periode</label>
          <input name="periode" value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
        </div>
        <button type="submit" disabled={saving} className="w-full bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        {msg && <div className={`text-xs ${msg.type === "error" ? "text-red-600" : "text-navy-700"}`}>{msg.text}</div>}
        <div className="flex gap-3 pt-1 text-xs">
          <a href={`/letters/${letter.id}/cetak`} target="_blank" rel="noreferrer" className="text-navy-700 underline">Lihat / Cetak</a>
          <a href={`/letters/${letter.id}/docx`} className="text-navy-700 underline">Unduh Word</a>
          <a href={`/letters/${letter.id}/pdf`} className="text-navy-700 underline">Unduh PDF</a>
        </div>
      </form>

      <div
        className="bg-white border border-gray-200 rounded-md p-8 h-fit"
        style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11pt", lineHeight: 1.5, textAlign: "justify" }}
      >
        <div className="border-b border-gray-800 pb-3 mb-3 text-center">
          <img src={kopUrl} alt={`Kop Surat ${bumdNama}`} className="w-full h-auto" />
        </div>
        <div className="mb-4" />
        {preview.header ? (
          <div className="text-center mb-6">
            <div className="font-bold underline uppercase">{preview.header.judul}</div>
            <div>NOMOR: {preview.data.NOMOR}</div>
            {preview.header.tentang && (
              <>
                <div className="mt-1">TENTANG</div>
                <div className="font-bold uppercase">{preview.header.tentang}</div>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-right mb-4">Kota Batu, {preview.data.TANGGAL}</p>
            <p className="mb-1">Nomor  : {preview.data.NOMOR}</p>
            <p className="mb-4">Perihal : {tpl.nama}</p>
          </>
        )}
        {splitParagraphs(preview.body).map((para, i) => (
          <p key={i} className="mb-4" style={{ whiteSpace: "pre-line" }}>{para}</p>
        ))}
        {preview.header && (
          <p className="mb-4" style={{ whiteSpace: "pre-line" }}>{`Ditetapkan di Kota Batu\npada tanggal ${preview.data.TANGGAL}`}</p>
        )}
        {tpl.signature.kind === "peserta" && (
          <div className="mt-8" style={{ marginLeft: "55%", width: "45%", textAlign: "left" }}>
            <p>Yang membuat pernyataan,</p>
            <p className="mt-14 font-bold underline">( {preview.data.NAMA_PESERTA} )</p>
          </div>
        )}
        {tpl.signature.kind === "single" && (
          <div className="mt-8" style={{ marginLeft: "55%", width: "45%", textAlign: "left" }}>
            <p>{preview.panitia},</p>
            <p className="mt-14 font-bold underline">( {signerNameOr(sig.ketua)} )</p>
            <p>Ketua Panitia Seleksi</p>
            <p>{signerNipLine(sig.ketua)}</p>
          </div>
        )}
        {tpl.signature.kind === "table5" && (
          <table className="mt-8 w-full text-xs border-collapse" style={{ border: "1px solid #333" }}>
            <thead>
              <tr>
                <th className="border border-gray-800 px-2 py-1 w-8">No</th>
                <th className="border border-gray-800 px-2 py-1">Nama</th>
                <th className="border border-gray-800 px-2 py-1">Jabatan</th>
                <th className="border border-gray-800 px-2 py-1">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {[
                { jabatan: "Ketua Pansel", signer: sig.ketua },
                { jabatan: "Sekretariat Pansel", signer: sig.sekretaris },
                { jabatan: "Anggota", signer: sig.anggota[0] ?? null },
                { jabatan: "Anggota", signer: sig.anggota[1] ?? null },
                { jabatan: "Anggota", signer: sig.anggota[2] ?? null },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="border border-gray-800 px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-gray-800 px-2 py-1">{signerNameOr(row.signer)}</td>
                  <td className="border border-gray-800 px-2 py-1">{row.jabatan}</td>
                  <td className="border border-gray-800 px-2 py-1">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tpl.signature.kind === "block3" && (
          <table className="mt-8 w-full text-xs border-collapse" style={{ border: "1px solid #333" }}>
            <tbody>
              <tr>
                {[
                  { label: "KETUA PANITIA SELEKSI", signer: sig.ketua },
                  { label: "SEKRETARIS PANITIA SELEKSI", signer: sig.sekretaris },
                  { label: "ANGGOTA/PEJABAT TERKAIT", signer: sig.anggota[0] ?? null },
                ].map((col, i) => (
                  <td key={i} className="border border-gray-800 px-2 py-2 text-center align-top w-1/3">
                    <div className="font-bold mb-10">{col.label}</div>
                    <div className="font-bold underline">{signerNameOr(col.signer)}</div>
                    <div>{signerNipLine(col.signer)}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
