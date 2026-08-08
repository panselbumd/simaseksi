export default function DecisionPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Keputusan</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Hanya KPM / Pejabat Berwenang yang memiliki RLS INSERT policy (<code>decisions_insert_kpm</code>) pada
        tabel <code>public.decisions</code> — Panitia dan Administrator Sistem tidak diberi hak ini sama sekali,
        sesuai aturan &quot;Admin ≠ Selection Authority&quot;. Bangun form penerbitan keputusan mengikuti pola
        <code> app/(app)/users/actions.ts</code> untuk Server Action-nya.
      </p>
    </div>
  );
}
