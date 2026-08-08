export default function RecommendationPage() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Rekomendasi</h1>
      <p className="text-sm text-ink-500 mb-6 max-w-2xl">
        Alur: Draf → Review → Revisi → Disetujui → Final. Tabel <code>public.recommendations</code> dan
        RLS policy-nya (<code>recs_insert_update_panitia</code>, <code>recs_approve_kpm</code>) sudah tersedia
        di <code>supabase/schema.sql</code>. Bangun halaman ini mengikuti pola persis
        <code> app/(app)/assessment/</code> (Server Component untuk baca + Server Action terpisah untuk tiap transisi status).
      </p>
    </div>
  );
}
