import { createClient } from "@/lib/supabase/server";
import { PublicBackground } from "@/components/PublicBackground";

// Halaman publik (tidak perlu login) — daftar seleksi yang tahapan
// pendaftarannya (status = REGISTRATION) sedang dibuka. Ditopang oleh RLS
// policy "selections_select_public" (status not in ('DRAFT')), jadi kolom
// ini benar terlihat oleh pengunjung anonim.
export default async function DaftarIndexPage() {
  const supabase = createClient();
  const { data: selections } = await supabase
    .from("selections")
    .select("id, nama, jabatan, tahun, status, bumds(nama)")
    .eq("status", "REGISTRATION")
    .order("tahun", { ascending: false });

  return (
    <PublicBackground>
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto pt-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950">S</div>
          <div>
            <div className="font-display font-bold text-lg text-white">SIMASEKSI</div>
            <div className="text-[10px] tracking-widest text-gold-400 uppercase">Kota Batu — Pendaftaran Peserta</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-display font-bold text-navy-900 mb-1">Seleksi yang Membuka Pendaftaran</h1>
          <p className="text-sm text-ink-500 mb-6">
            Pendaftaran hanya dapat dilakukan selama tahapan seleksi berstatus <b>Pendaftaran</b>. Sudah punya akun?{" "}
            <a href="/login" className="text-navy-700 underline">Masuk di sini</a>.
          </p>

          {!selections?.length && (
            <div className="text-sm text-ink-500 bg-navy-50 rounded-md p-4 text-center">
              Belum ada seleksi yang membuka tahapan pendaftaran saat ini. Silakan cek kembali nanti atau lihat pengumuman resmi.
            </div>
          )}

          <div className="space-y-3">
            {selections?.map((s: any) => (
              <a
                key={s.id}
                href={`/daftar/${s.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-navy-300 hover:bg-navy-50 transition"
              >
                <div className="font-semibold text-navy-900">{s.nama}</div>
                <div className="text-xs text-ink-500 mt-0.5">{s.bumds?.nama} · {s.jabatan} · Tahun {s.tahun}</div>
                <div className="mt-2 text-[11px] inline-block bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-semibold">Pendaftaran Dibuka</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
    </PublicBackground>
  );
}
