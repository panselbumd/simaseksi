import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type AppRole } from "@/lib/rbac";
import { finalizeLetterAction, deleteLetterAction } from "@/app/(app)/letters/actions";

// "Cetak/Unduh Surat" from Manajemen Seleksi opens here — a view scoped to
// this one selection's own letters, without leaving the Selections module
// (previously this linked out to the separate Generator Surat menu, which
// dropped the selection context and felt like a broken/wrong link).
// Drafting brand-new letters still happens in Generator Surat (it needs the
// jenis-surat template picker), but every letter already drafted for this
// selection can be viewed/printed/downloaded/finalized/deleted right here.
export default async function SelectionSuratPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const role = profile?.role as AppRole;

  const { data: selection } = await supabase
    .from("selections")
    .select("id, nama, jabatan, status, bumds(nama)")
    .eq("id", id)
    .single();
  if (!selection) notFound();

  const { data: letters } = await supabase
    .from("letters")
    .select("id, nama_surat, nomor, tanggal, status")
    .eq("selection_id", id)
    .order("created_at", { ascending: false });

  const canManageLetters = role === "PANITIA_SELEKSI";

  return (
    <div>
      <Link href="/selections" className="text-xs text-navy-700 underline">&larr; Kembali ke Manajemen Seleksi</Link>
      <div className="flex items-start justify-between mb-1 mt-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Cetak / Unduh Surat</h1>
          <p className="text-sm text-ink-500">{selection.nama} — {(selection as any).bumds?.nama}</p>
        </div>
        {canManageLetters && (
          <Link
            href={`/letters?selection=${id}`}
            className="text-xs border border-navy-200 text-navy-700 font-semibold rounded-md px-3 py-2 whitespace-nowrap hover:bg-navy-50"
          >
            + Susun Surat Baru di Generator Surat
          </Link>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {letters?.map((l: any) => (
              <tr key={l.id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-3 font-medium">{l.nama_surat}</td>
                <td className="px-4 py-3">{l.nomor}</td>
                <td className="px-4 py-3">{new Date(l.tanggal).toLocaleDateString("id-ID")}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${l.status === "FINAL" ? "bg-navy-900 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {l.status === "FINAL" ? "Final" : "Draf"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {canManageLetters && l.status === "DRAFT" && (
                      <a href={`/letters/${l.id}/edit`} className="text-xs bg-navy-900 text-white font-semibold rounded-md px-2.5 py-1 hover:bg-navy-800">✎ Edit</a>
                    )}
                    <a href={`/letters/${l.id}/cetak`} target="_blank" rel="noreferrer" className="text-xs border border-gray-200 rounded-md px-2.5 py-1 hover:bg-gray-50">Lihat / Cetak</a>
                    <a href={`/letters/${l.id}/docx`} className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-2.5 py-1 hover:bg-navy-100">Unduh Word</a>
                    <a href={`/letters/${l.id}/pdf`} className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-2.5 py-1 hover:bg-navy-100">Unduh PDF</a>
                    {canManageLetters && l.status === "DRAFT" && (
                      <>
                        <form action={finalizeLetterAction.bind(null, l.id)}>
                          <button className="text-xs bg-green-600 text-white font-semibold rounded-md px-2.5 py-1">Finalisasi</button>
                        </form>
                        <form action={deleteLetterAction.bind(null, l.id)}>
                          <button className="text-xs bg-red-50 text-red-700 font-semibold rounded-md px-2.5 py-1">Hapus</button>
                        </form>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) ?? null}
            {(!letters || letters.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                Belum ada surat untuk seleksi ini.
                {canManageLetters && <> Susun draf pertama lewat <Link href={`/letters?selection=${id}`} className="text-navy-700 underline">Generator Surat</Link>.</>}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
