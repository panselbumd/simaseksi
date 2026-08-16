"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LETTER_TEMPLATES, LETTER_CATEGORIES, CUSTOM_TEMPLATE_ID,
  fillTemplate, fmtTanggalPanjang, letterHeaderFor, splitParagraphs,
  type LetterTemplate, type LetterLayout, type SignatureSpec,
} from "@/lib/letter-templates";
import { signerNameOr, signerNipLine, type SignatureData } from "@/lib/letter-signature";
import { createLetterAction } from "./actions";

type SelectionOption = {
  id: string;
  nama: string;
  jabatan: string;
  dasar_hukum: string | null;
  bumd_nama: string;
  kop_url: string | null;
  alamat: string | null;
};

const EMPTY_SIGNATURE: SignatureData = { ketua: null, sekretaris: null, anggota: [], timUkk: [] };

const SIGNATURE_LABEL: Record<SignatureSpec["kind"], string> = {
  single: "Ketua Panitia Seleksi saja",
  table5: "Tabel 5 orang (Ketua/Sekretaris/Anggota×3) tanda tangan individual",
  block3: "Blok 3 kolom: Ketua / Sekretaris / Anggota",
  peserta: "Peserta/Calon yang menandatangani",
};

export default function GeneratorForm({
  selections, initialSelectionId, signatureBySelection = {},
}: {
  selections: SelectionOption[];
  initialSelectionId?: string;
  signatureBySelection?: Record<string, SignatureData>;
}) {
  const router = useRouter();
  const [jenisId, setJenisId] = useState(LETTER_TEMPLATES[0].id);
  const [selectionId, setSelectionId] = useState(
    (initialSelectionId && selections.some((s) => s.id === initialSelectionId)) ? initialSelectionId : (selections[0]?.id ?? "")
  );
  const [nomor, setNomor] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [namaPeserta, setNamaPeserta] = useState("");
  const [periode, setPeriode] = useState("2026-2031");

  // Naskah Dinas Kustom — hanya relevan saat jenisId === CUSTOM_TEMPLATE_ID.
  const [namaSurat, setNamaSurat] = useState("");
  const [customJudul, setCustomJudul] = useState("");
  const [customTentang, setCustomTentang] = useState("");
  const [customLayout, setCustomLayout] = useState<LetterLayout>("korespondensi");
  const [customSignature, setCustomSignature] = useState<SignatureSpec["kind"]>("single");

  // Redaksi/isi naskah — sekarang bisa diedit bebas. Diisi otomatis dari
  // template saat jenis surat dipilih/berganti; setelahnya sepenuhnya di
  // tangan Panitia sampai ditekan "Isi ulang dari template".
  const [isi, setIsi] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const isCustom = jenisId === CUSTOM_TEMPLATE_ID;
  const sel = selections.find((s) => s.id === selectionId);
  const sig = signatureBySelection[selectionId] ?? EMPTY_SIGNATURE;

  const computedData = useMemo(() => {
    if (!sel) return null;
    const panitia = `Panitia Seleksi ${sel.jabatan} ${sel.bumd_nama}`;
    return {
      NOMOR: nomor.trim() || "—/—/2026",
      TANGGAL: fmtTanggalPanjang(tanggal),
      BUMD: sel.bumd_nama,
      NAMA_PESERTA: namaPeserta.trim() || "[Nama Peserta]",
      JABATAN: sel.jabatan,
      PERIODE: periode.trim() || "-",
      DASAR_HUKUM: sel.dasar_hukum || "—",
      PANITIA: panitia,
      TIM_UKK: "Tim Uji Kompetensi dan Kelayakan",
    };
  }, [sel, nomor, tanggal, namaPeserta, periode]);

  const tpl: LetterTemplate = useMemo(() => {
    if (!isCustom) return LETTER_TEMPLATES.find((t) => t.id === jenisId)!;
    return {
      id: CUSTOM_TEMPLATE_ID,
      nama: namaSurat || "Naskah Kustom",
      kategori: "Kustom",
      layout: customLayout,
      judulDinas: customJudul || (namaSurat ? namaSurat.toUpperCase() : "NASKAH DINAS"),
      tentang: customTentang || undefined,
      signature: { kind: customSignature },
      template: "",
    };
  }, [isCustom, jenisId, namaSurat, customJudul, customTentang, customLayout, customSignature]);

  const header = computedData ? letterHeaderFor(tpl, computedData) : null;

  // Isi otomatis diisi ulang setiap kali jenis surat (template) diganti —
  // bukan saat mengetik nomor/tanggal/dst, supaya suntingan tangan tidak
  // hilang. Untuk Naskah Kustom, mulai dari kosong.
  useEffect(() => {
    if (isCustom) { setIsi(""); return; }
    if (!computedData) return;
    setIsi(fillTemplate(tpl.template, computedData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenisId]);

  function resetFromTemplate() {
    if (isCustom || !computedData) return;
    setIsi(fillTemplate(tpl.template, computedData));
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    try {
      await createLetterAction(formData);
      setMsg({ type: "ok", text: "Draf surat tersimpan — lihat di daftar \u201cDraf Tersimpan\u201d di bawah." });
      setNomor("");
      setNamaPeserta("");
      // revalidatePath() in the server action only invalidates the cache —
      // it does NOT re-render this already-mounted page, so without this
      // the new draft silently never shows up in the list below and it
      // looks like saving did nothing even though it succeeded.
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message || "Gagal menyimpan draf." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "380px 1fr" }}>
      <form action={handleSubmit} className="bg-white border border-gray-200 rounded-md p-5 space-y-3 h-fit">
        <div className="text-sm font-display font-bold text-navy-900 mb-1">+ Tambah Surat Baru</div>
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
              <input name="nama_surat" value={namaSurat} onChange={(e) => setNamaSurat(e.target.value)} placeholder="mis. Surat Pemberitahuan Perpanjangan Jadwal" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" required />
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
                  <input name="custom_judul" value={customJudul} onChange={(e) => setCustomJudul(e.target.value)} placeholder={namaSurat ? namaSurat.toUpperCase() : "mis. SURAT KETERANGAN"} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tentang (opsional)</label>
                  <input name="custom_tentang" value={customTentang} onChange={(e) => setCustomTentang(e.target.value)} placeholder="mis. PERPANJANGAN JADWAL PENDAFTARAN" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
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
          <label className="block text-xs font-semibold mb-1">Seleksi</label>
          <select name="selection_id" value={selectionId} onChange={(e) => setSelectionId(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            {selections.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Nomor Surat</label>
          <input name="nomor" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="mis. 800.1.11.2/123/422.107/2026" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Tanggal</label>
          <input type="date" name="tanggal" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Peserta (opsional)</label>
          <input name="nama_peserta" value={namaPeserta} onChange={(e) => setNamaPeserta(e.target.value)} placeholder="mis. Ahmad Prasetyo Wibowo" className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
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
            name="isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={14} required
            placeholder={isCustom ? "Tulis redaksi naskah di sini. Gunakan baris kosong ganda untuk memisahkan paragraf." : undefined}
            className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs font-mono leading-relaxed"
          />
          <p className="text-[11px] text-ink-500 mt-1">Baris kosong ganda memisahkan paragraf. Bagian berkurung seperti [tempat]/[jam] silakan diganti langsung sebelum surat difinalisasi.</p>
        </div>

        <button type="submit" disabled={saving || !selectionId} className="w-full bg-navy-900 text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan sebagai Draf"}
        </button>
        {msg && (
          <div className={`text-xs rounded-md p-2.5 font-medium ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
            {msg.text}
          </div>
        )}
      </form>

      <div>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md p-3 mb-3">
          <b>Bahan Bantu, Bukan Dokumen Resmi.</b> Draf yang dihasilkan wajib diverifikasi oleh pejabat/pihak berwenang sebelum digunakan sebagai dokumen resmi. Simpan draf untuk mengunduh versi Word/PDF dan mencetaknya sesuai format tata naskah dinas.
        </div>
        {computedData && sel ? (
          <div
            className="bg-white border border-gray-200 rounded-md p-8"
            style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11pt", lineHeight: 1.5, textAlign: "justify" }}
          >
            <div className="pb-3 mb-3 text-center">
              {sel.kop_url && <img src={sel.kop_url} alt={`Kop Surat ${sel.bumd_nama}`} className="w-full h-auto" />}
            </div>
            <div className="mb-4" />{/* jarak kop ke isi surat: 1.5 spasi */}
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
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-md p-10 text-center text-sm text-ink-500">
            Pilih seleksi untuk menampilkan pratinjau surat.
          </div>
        )}
      </div>
    </div>
  );
}
