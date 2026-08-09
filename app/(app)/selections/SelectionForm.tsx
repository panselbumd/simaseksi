const SELECTION_TYPE_LABEL: Record<string, string> = {
  OPEN_SELECTION: "Seleksi Terbuka (Open Selection)",
  INTERNAL_SELECTION: "Seleksi Internal",
};
const CANDIDATE_SOURCE_LABEL: Record<string, string> = {
  PUBLIC_REGISTRATION: "Pendaftaran Publik",
  INTERNAL_PEMDA: "Internal Pemda",
  NOMINATION: "Nominasi",
  OTHER: "Lainnya",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf", PLANNED: "Direncanakan", PUBLISHED: "Dipublikasikan", REGISTRATION: "Pendaftaran",
  VERIFICATION: "Verifikasi", UKK: "UKK", INTERVIEW: "Wawancara", FINALIZATION: "Finalisasi",
  COMPLETED: "Selesai", ARCHIVED: "Diarsipkan",
};

export type SelectionFormValues = {
  nama?: string;
  jabatan?: string;
  tahun?: number;
  formasi?: number;
  bumd_id?: string;
  selection_type?: string;
  candidate_source?: string;
  dasar_hukum?: string | null;
  status?: string;
};

export default function SelectionForm({
  action,
  bumds,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  bumds: { id: string; nama: string }[];
  initial?: SelectionFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="bg-white border border-gray-200 rounded-md p-6 grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-xs font-semibold mb-1">Nama Seleksi</label>
        <input name="nama" required defaultValue={initial?.nama} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">BUMD</label>
        <select name="bumd_id" required defaultValue={initial?.bumd_id} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
          <option value="">Pilih BUMD</option>
          {bumds.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Jabatan</label>
        <input name="jabatan" required defaultValue={initial?.jabatan} placeholder="Direksi, Dewan Pengawas, Komisaris, ..." className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Tahun</label>
        <input name="tahun" type="number" required defaultValue={initial?.tahun} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Formasi (jumlah kursi)</label>
        <input name="formasi" type="number" min={1} defaultValue={initial?.formasi ?? 1} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Tipe Seleksi</label>
        <select name="selection_type" required defaultValue={initial?.selection_type} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
          <option value="">Pilih tipe</option>
          {Object.entries(SELECTION_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Sumber Kandidat</label>
        <select name="candidate_source" required defaultValue={initial?.candidate_source} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
          <option value="">Pilih sumber</option>
          {Object.entries(CANDIDATE_SOURCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Status</label>
        <select name="status" defaultValue={initial?.status ?? "DRAFT"} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm">
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold mb-1">Dasar Hukum (opsional)</label>
        <input name="dasar_hukum" defaultValue={initial?.dasar_hukum ?? ""} className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-sm" />
      </div>
      <div className="col-span-2 flex gap-3 pt-2">
        <button type="submit" className="bg-navy-900 text-white text-sm font-semibold rounded-md px-5 py-2">{submitLabel}</button>
        <a href="/selections" className="text-sm text-ink-500 px-5 py-2">Batal</a>
      </div>
    </form>
  );
}
