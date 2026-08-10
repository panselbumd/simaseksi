"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LETTER_TEMPLATES, fillTemplate, fmtTanggalPanjang } from "@/lib/letter-templates";
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
  letter, bumdNama, jabatan, kopUrl,
}: { letter: LetterDraft; bumdNama: string; jabatan: string; kopUrl: string }) {
  const router = useRouter();
  const [jenisId, setJenisId] = useState(letter.jenis_surat);
  const [nomor, setNomor] = useState(letter.nomor);
  const [tanggal, setTanggal] = useState(letter.tanggal);
  const [namaPeserta, setNamaPeserta] = useState(letter.nama_peserta);
  const [periode, setPeriode] = useState(letter.periode);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const tpl = LETTER_TEMPLATES.find((t) => t.id === jenisId) ?? LETTER_TEMPLATES[0];

  const preview = useMemo(() => {
    const panitia = `Panitia Seleksi ${jabatan} ${bumdNama}`;
    const data: Record<string, string> = {
      NOMOR: nomor.trim() || "—/—/2026",
      TANGGAL: fmtTanggalPanjang(tanggal),
      BUMD: bumdNama,
      NAMA_PESERTA: namaPeserta.trim() || "[Nama Peserta]",
      JABATAN: jabatan,
      PERIODE: periode.trim() || "-",
      DASAR_HUKUM: "—",
      PANITIA: panitia,
      TIM_UKK: "Tim Uji Kompetensi dan Kelayakan",
    };
    return { body: fillTemplate(tpl.template, data), panitia, data };
  }, [tpl, nomor, tanggal, namaPeserta, periode, jabatan, bumdNama]);

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
            {LETTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
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
        <p className="text-right mb-4">Kota Batu, {preview.data.TANGGAL}</p>
        <p className="mb-1">Nomor  : {preview.data.NOMOR}</p>
        <p className="mb-4">Perihal : {tpl.nama}</p>
        <p>{preview.body}</p>
        <div className="mt-8" style={{ marginLeft: "55%", width: "45%", textAlign: "left" }}>
          <p>{preview.panitia},</p>
          <p className="mt-14 font-bold underline">( ................................................ )</p>
          <p>Ketua Panitia Seleksi</p>
        </div>
      </div>
    </div>
  );
}
