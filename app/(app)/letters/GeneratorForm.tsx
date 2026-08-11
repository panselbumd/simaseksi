"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LETTER_TEMPLATES, fillTemplate, fmtTanggalPanjang } from "@/lib/letter-templates";
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

export default function GeneratorForm({ selections }: { selections: SelectionOption[] }) {
  const router = useRouter();
  const [jenisId, setJenisId] = useState(LETTER_TEMPLATES[0].id);
  const [selectionId, setSelectionId] = useState(selections[0]?.id ?? "");
  const [nomor, setNomor] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [namaPeserta, setNamaPeserta] = useState("");
  const [periode, setPeriode] = useState("2026-2031");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const tpl = LETTER_TEMPLATES.find((t) => t.id === jenisId)!;
  const sel = selections.find((s) => s.id === selectionId);

  const preview = useMemo(() => {
    if (!sel) return null;
    const panitia = `Panitia Seleksi ${sel.jabatan} ${sel.bumd_nama}`;
    const data: Record<string, string> = {
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
    return { body: fillTemplate(tpl.template, data), panitia, data };
  }, [sel, tpl, nomor, tanggal, namaPeserta, periode]);

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
    <div className="grid gap-6" style={{ gridTemplateColumns: "340px 1fr" }}>
      <form action={handleSubmit} className="bg-white border border-gray-200 rounded-md p-5 space-y-3 h-fit">
        <div className="text-sm font-display font-bold text-navy-900 mb-1">+ Tambah Surat Baru</div>
        <div>
          <label className="block text-xs font-semibold mb-1">Jenis Surat</label>
          <select name="jenis_surat" value={jenisId} onChange={(e) => setJenisId(e.target.value)} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
            {LETTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
          </select>
        </div>
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
        {preview && sel ? (
          <div
            className="bg-white border border-gray-200 rounded-md p-8"
            style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11pt", lineHeight: 1.5, textAlign: "justify" }}
          >
            <div className="border-b border-gray-800 pb-3 mb-3 text-center">
              {sel.kop_url && <img src={sel.kop_url} alt={`Kop Surat ${sel.bumd_nama}`} className="w-full h-auto" />}
            </div>
            <div className="mb-4" />{/* jarak kop ke isi surat: 1.5 spasi */}
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
        ) : (
          <div className="bg-white border border-dashed border-gray-300 rounded-md p-10 text-center text-sm text-ink-500">
            Pilih seleksi untuk menampilkan pratinjau surat.
          </div>
        )}
      </div>
    </div>
  );
}
