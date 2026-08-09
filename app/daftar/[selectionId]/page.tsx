import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RegisterForm from "./RegisterForm";

export default async function DaftarSelectionPage({ params }: { params: Promise<{ selectionId: string }> }) {
  const { selectionId } = await params;
  const supabase = await createClient();
  const { data: selection } = await supabase
    .from("selections")
    .select("id, nama, jabatan, tahun, status, bumds(nama)")
    .eq("id", selectionId)
    .single();

  if (!selection) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6">
      <div className="max-w-xl mx-auto pt-10 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950">S</div>
          <div>
            <div className="font-display font-bold text-lg text-white">SIMASEKSI</div>
            <div className="text-[10px] tracking-widest text-gold-400 uppercase">Kota Batu — Pendaftaran Peserta</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-display font-bold text-navy-900 mb-1">{selection.nama}</h1>
          <p className="text-sm text-ink-500 mb-6">{(selection as any).bumds?.nama} · {selection.jabatan} · Tahun {selection.tahun}</p>

          {selection.status !== "REGISTRATION" ? (
            <div className="bg-amber-50 text-amber-800 text-sm rounded-md p-4">
              Tahapan pendaftaran untuk seleksi ini belum atau tidak lagi dibuka. Silakan pantau{" "}
              <a href="/daftar" className="underline">daftar seleksi yang sedang membuka pendaftaran</a>.
            </div>
          ) : (
            <RegisterForm selectionId={selection.id} />
          )}
        </div>
      </div>
    </div>
  );
}
