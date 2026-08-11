import { createClient } from "@/lib/supabase/server";
import GeneratorForm from "./GeneratorForm";
import { finalizeLetterAction, deleteLetterAction } from "./actions";
import { kopBannerAssetFor } from "@/lib/letter-format";

export default async function LettersPage({ searchParams }: { searchParams?: Promise<{ selection?: string }> }) {
  // Defensive: on some client-triggered refreshes Next.js may not thread a
  // searchParams value at all (no query string present), so `searchParams`
  // itself can be undefined rather than a Promise that resolves to `{}`.
  // Awaiting undefined is harmless, but destructuring it directly would
  // throw ("Cannot destructure property 'selection' of undefined") and
  // crash this whole page's render — which is exactly the kind of error a
  // Server Component render failure looks like from the outside.
  const resolvedSearchParams = (await searchParams) ?? {};
  const preselectedSelectionId = resolvedSearchParams.selection;

  // Everything below is wrapped so that any unexpected failure (a bad
  // query, a null we didn't anticipate, etc.) renders as a plain-language
  // message on THIS page instead of crashing to Next.js's generic
  // "error occurred in the Server Components render" screen, which hides
  // the real cause from both of us. If this still happens, the digest
  // shown by app/(app)/letters/error.tsx (the outer safety net) is what to
  // send back for diagnosis.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return <div className="text-sm text-red-600">Sesi Anda telah berakhir. Silakan muat ulang halaman dan masuk kembali.</div>;
    }
    const { data: profile, error: profileErr } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileErr) throw new Error(`Gagal memuat profil akun: ${profileErr.message}`);
    const role = profile?.role;

    const { data: selectionsRaw, error: selErr } = await supabase
      .from("selections")
      .select("id, nama, jabatan, dasar_hukum, bumds(nama, kop_image_path, alamat)")
      .order("created_at", { ascending: false });
    if (selErr) throw new Error(`Gagal memuat daftar seleksi: ${selErr.message}`);

    const selections = (selectionsRaw ?? []).map((s: any) => ({
      id: s.id,
      nama: s.nama,
      jabatan: s.jabatan,
      dasar_hukum: s.dasar_hukum,
      bumd_nama: s.bumds?.nama || "-",
      alamat: s.bumds?.alamat || null,
      kop_url: kopBannerAssetFor(s.bumds?.nama || ""),
    }));

    const { data: letters, error: lettersErr } = await supabase
      .from("letters")
      .select("id, nama_surat, nomor, tanggal, status, created_at, selections(nama)")
      .order("created_at", { ascending: false });
    if (lettersErr) throw new Error(`Gagal memuat daftar draf surat: ${lettersErr.message}`);

    return (
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900 mb-1">Generator Surat</h1>
        <p className="text-sm text-ink-500 mb-6 max-w-2xl">
          Susun draf surat resmi dengan kop surat panitia seleksi terkait. Format mengikuti tata naskah dinas
          pemerintah daerah: font Arial 11pt, margin 1,5/2,5/2/2 cm, spasi 1,5, rata kiri-kanan.
        </p>

        {role === "PANITIA_SELEKSI" && selections.length > 0 && (
          <div className="mb-8">
            <GeneratorForm selections={selections} initialSelectionId={preselectedSelectionId} />
          </div>
        )}
        {role === "PANITIA_SELEKSI" && selections.length === 0 && (
          <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md p-4">
            <b>Belum ada seleksi yang bisa Anda kelola suratnya.</b>{" "}
            Akun Anda belum tercatat sebagai anggota Panitia Seleksi pada seleksi manapun, sehingga formulir
            "Tambah Surat Baru" belum bisa ditampilkan. Ini biasanya berarti migrasi database{" "}
            <code className="bg-amber-100 px-1 rounded">migration_0006_fix_pansel_membership.sql</code> belum
            dijalankan di Supabase — jalankan migrasi tersebut lalu muat ulang halaman ini.
          </div>
        )}

        <h2 className="text-sm font-bold text-navy-900 mb-3">Draf Tersimpan</h2>
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 text-left text-[11px] uppercase text-ink-700">
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Seleksi</th>
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
                  <td className="px-4 py-3">{l.selections?.nama}</td>
                  <td className="px-4 py-3">{l.nomor}</td>
                  <td className="px-4 py-3">{l.tanggal ? new Date(l.tanggal).toLocaleDateString("id-ID") : "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${l.status === "FINAL" ? "bg-navy-900 text-white" : "bg-gray-100 text-gray-700"}`}>
                      {l.status === "FINAL" ? "Final" : "Draf"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <a href={`/letters/${l.id}/cetak`} target="_blank" rel="noreferrer" className="text-xs border border-gray-200 rounded-md px-2.5 py-1 hover:bg-gray-50">Lihat / Cetak</a>
                      <a href={`/letters/${l.id}/docx`} className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-2.5 py-1 hover:bg-navy-100">Unduh Word</a>
                      <a href={`/letters/${l.id}/pdf`} className="text-xs bg-navy-50 text-navy-800 font-semibold rounded-md px-2.5 py-1 hover:bg-navy-100">Unduh PDF</a>
                      {role === "PANITIA_SELEKSI" && l.status === "DRAFT" && (
                        <>
                          <a href={`/letters/${l.id}/edit`} className="text-xs border border-navy-200 text-navy-700 font-semibold rounded-md px-2.5 py-1 hover:bg-navy-50">Edit</a>
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
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">Belum ada draf surat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (e: any) {
    return (
      <div className="max-w-xl bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-4">
        <b>Generator Surat gagal dimuat.</b>
        <p className="mt-1">{e?.message || "Kesalahan tidak diketahui."}</p>
      </div>
    );
  }
}
