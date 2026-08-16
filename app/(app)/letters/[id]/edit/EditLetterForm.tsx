"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LETTER_TEMPLATES, LETTER_CATEGORIES, CUSTOM_TEMPLATE_ID,
  fillTemplate, fmtTanggalPanjang, letterHeaderFor, splitParagraphs,
  type LetterTemplate, type LetterLayout, type SignatureSpec,
} from "@/lib/letter-templates";
import { signerNameOr, signerNipLine, type SignatureData } from "@/lib/letter-signature";
import { updateLetterAction } from "../../actions";

type LetterDraft = {
  id: string;
  jenis_surat: string;
  nomor: string;
  tanggal: string;
  nama_peserta: string;
  periode: string;
  isi: string;
  nama_surat: string;
  custom_judul: string;
  custom_tentang: string;
  custom_layout: LetterLayout;
  custom_signature: SignatureSpec["kind"];
};

const SIGNATURE_LABEL: Record<SignatureSpec["kind"], string> = {
  single: "Ketua Panitia Seleksi saja",
  table5: "Tabel 5 orang (Ketua/Sekretaris/Anggota×3) tanda tangan individual",
  block3: "Blok 3 kolom: Ketua / Sekretaris / Anggota",
  peserta: "Peserta/Calon yang menandatangani",
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
  const [isi, setIsi] = useState(letter.isi);

  const [namaSurat, setNamaSurat] = useState(letter.jenis_surat === CUSTOM_TEMPLATE_ID ? letter.nama_surat : "");
  const [customJudul, setCustomJudul] = useState(letter.custom_judul);
  const [customTentang, setCustomTentang] = useState(letter.custom_tentang);
  const [customLayout, setCustomLayout] = useState<LetterLayout>(letter.custom_layout);
  const [customSignature, setCustomSignature] = useState<SignatureSpec["kind"]>(letter.custom_signature);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const isCustom = jenisId === CUSTOM_TEMPLATE_ID;
  const sig = signature;

  const tpl: LetterTemplate = useMemo(() => {
    if (!isCustom) return LETTER_TEMPLATES.find((t) => t.id === jenisId) ?? LETTER_TEMPLATES[0];
    return {
      id: CUSTOM_TEMPLATE_ID,
      nama: namaSurat || letter.nama_surat || "Naskah Kustom",
      kategori: "Kustom",
      layout: customLayout,
      judulDinas: customJudul || (namaSurat ? namaSurat.toUpperCase() : "NASKAH DINAS"),
      tentang: customTentang || undefined,
      signature: { kind: customSignature },
      template: "",
    };
  }, [isCustom, jenisId, namaSurat, customJudul, customTentang, customLayout, customSignature, letter.nama_surat]);

  const computedData = useMemo(() => {
    const panitia = `Panitia Seleksi ${jabatan} ${bumdNama}`;
    return {
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
  }, [nomor, tanggal, namaPeserta, periode, jabatan, bumdNama, dasarHukum]);

  const header = letterHeaderFor(tpl, computedData);

  function resetFromTemplate() {
    if (isCustom) return;
    const fresh = LETTER_TEMPLATES.find((t) => t.id === jenisId);
    if (fresh) setIsi(fillTemplate(fresh.template, computedData));
  }

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
    <div className="grid gap-6" style={{ gridTemplateColumns: "380px 1fr" }}>
      <form action={handleSubmit} className="bg-white border border-gray-200 rounded-md p-5 space-y-3 h-fit">
        <div>
          <label className="block text-xs font-semibold mb-1">Jenis Surat</label>
          <select name="jenis_surat" value={jenisId} onChange={(e) => setJenisId(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            <optgroup label="Kustom">
              <option value={CUSTOM_TEMPLATE_ID}>✎ Naskah Dinas Kustom (isi &amp; format sendiri)</option>
            </optgroup>
            {LETTER_CATEGORIES.map((kategori) => (
              <optgroup key={kategori} label={kategori}>
                {LETTER_TEMPLATES.filter((t) => t.kategori === kategori).map((t) => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {isCustom && (
          <div className="border border-dashed border-navy-200 rounded-md p-3 space-y-3 bg-navy-50/40">
            <div>
              <label className="block text-xs font-semibold mb-1">Judul/Nama Naskah</label>
              <input name="nama_surat" value={namaSurat} onChange={(e) => setNamaSurat(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Bentuk Naskah</label>
              <select name="custom_layout" value={customLayout} onChange={(e) => setCustomLayout(e.target.value as LetterLayout)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                <option value="korespondensi">Surat biasa (Nomor/Perihal, ditujukan ke pihak tertentu)</option>
                <option value="judul">Judul di tengah (mis. gaya Berita Acara/Pengumuman)</option>
              </select>
            </div>
            {customLayout === "judul" && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1">Judul Dinas (baris judul di tengah)</label>
                  <input name="custom_judul" value={customJudul} onChange={(e) => setCustomJudul(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tentang (opsional)</label>
                  <input name="custom_tentang" value={customTentang} onChange={(e) => setCustomTentang(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1">Bentuk Tanda Tangan</label>
              <select name="custom_signature" value={customSignature} onChange={(e) => setCustomSignature(e.target.value as SignatureSpec["kind"])} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
                {(Object.keys(SIGNATURE_LABEL) as SignatureSpec["kind"][]).map((k) => (
                  <option key={k} value={k}>{SIGNATURE_LABEL[k]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold">Isi Naskah (redaksi — bisa diedit bebas)</label>
            {!isCustom && (
              <button type="button" onClick={resetFromTemplate} className="text-[11px] text-navy-700 underline hover:text-navy-900">
                ↻ Isi ulang dari template
              </button>
            )}
          </div>
          <textarea
            name="isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={16} required
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs font-mono leading-relaxed"
          />
          <p className="text-[11px] text-ink-500 mt-1">Baris kosong ganda memisahkan paragraf.</p>
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
        <div className="pb-3 mb-3 text-center">
          <img src={kopUrl} alt={`Kop Surat ${bumdNama}`} className="w-full h-auto" />
        </div>
        <div className="mb-4" />
        {header ? (
          <div className="text-center mb-6">
            <div className="font-bold underline uppercase">{header.judul}</div>
            <div>NOMOR: {computedData.NOMOR}</div>
            {header.tentang && (
              <>
                <div className="mt-1">TENTANG</div>
                <div className="font-bold uppercase">{header.tentang}</div>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-right mb-4">Kota Batu, {computedData.TANGGAL}</p>
            <p className="mb-1">Nomor  : {computedData.NOMOR}</p>
            <p className="mb-4">Perihal : {tpl.nama}</p>
          </>
        )}
        {splitParagraphs(isi).map((para, i) => (
          <p key={i} className="mb-4" style={{ whiteSpace: "pre-line" }}>{para}</p>
        ))}
        {header && (
          <p className="mb-4" style={{ whiteSpace: "pre-line" }}>{`Ditetapkan di Kota Batu\npada tanggal ${computedData.TANGGAL}`}</p>
        )}
        {tpl.signature.kind === "peserta" && (
          <div className="mt-8" style={{ marginLeft: "55%", width: "45%", textAlign: "left" }}>
            <p>Yang membuat pernyataan,</p>
            <p className="mt-14 font-bold underline">( {computedData.NAMA_PESERTA} )</p>
          </div>
        )}
        {tpl.signature.kind === "single" && (
          <div className="mt-8" style={{ marginLeft: "55%", width: "45%", textAlign: "left" }}>
            <p>{computedData.PANITIA},</p>
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
