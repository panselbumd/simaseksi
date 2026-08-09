import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroBackground from "@/components/HeroBackground";

const ALUR = [
  "Perencanaan & Persiapan",
  "Panitia & Tim UKK",
  "Pendaftaran / Nominasi",
  "Verifikasi & Eligibility",
  "UKK & Wawancara",
  "Ranking & Rekomendasi",
  "Keputusan & Penetapan",
];

const FAQ = [
  { q: "Siapa yang dapat mendaftar sebagai peserta seleksi?", a: "Warga negara Indonesia yang memenuhi persyaratan administratif dan kompetensi sesuai jabatan yang dibuka, sebagaimana tercantum pada pengumuman resmi tiap seleksi." },
  { q: "Kapan pendaftaran dibuka?", a: "Hanya selama tahapan seleksi berstatus \"Pendaftaran\". Sistem menolak pendaftaran di luar rentang waktu tersebut secara otomatis." },
  { q: "Bagaimana cara memantau status berkas saya?", a: "Setelah mendaftar dan masuk ke akun Anda, halaman Dokumen menampilkan status verifikasi tiap berkas persyaratan secara real-time." },
  { q: "Siapa yang menentukan hasil akhir seleksi?", a: "Ranking dihitung otomatis dari nilai UKK. Rekomendasi disusun Panitia Seleksi dan hanya disahkan oleh KPM / Pejabat Berwenang — Administrator sistem tidak memiliki kewenangan atas nilai maupun keputusan." },
];

export default async function PublicHome() {
  const supabase = createClient();

  const [{ data: bumds }, { data: openSelections }, { data: regulations }] = await Promise.all([
    supabase.from("bumds").select("id, nama, bidang_usaha, tahun_berdiri, status").order("nama"),
    supabase.from("selections").select("id, nama, jabatan, tahun, status, bumds(nama)").eq("status", "REGISTRATION").order("tahun", { ascending: false }),
    supabase.from("regulations").select("kategori, judul, nomor, tahun").neq("status", "DRAFT").order("tahun", { ascending: false }).limit(8),
  ]);

  return (
    <main className="bg-navy-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-navy-950/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950">S</div>
            <div>
              <div className="font-display font-bold text-sm leading-tight">SIMASEKSI</div>
              <div className="text-[10px] tracking-widest text-gold-400 uppercase leading-tight">Kota Batu</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/80">
            <a href="#beranda" className="hover:text-white">Beranda</a>
            <a href="#bumd" className="hover:text-white">BUMD</a>
            <a href="#seleksi" className="hover:text-white">Seleksi</a>
            <a href="#regulasi" className="hover:text-white">Regulasi</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#kontak" className="hover:text-white">Kontak</a>
          </nav>
          <Link href="/login" className="bg-gold-500 text-navy-950 text-sm font-semibold rounded-md px-4 py-2 hover:bg-gold-400">Login</Link>
        </div>
      </header>

      {/* Hero */}
      <section id="beranda" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800" />
        <HeroBackground />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-400 uppercase mb-5">
              <span className="w-8 h-px bg-gold-400/60" /> Pemerintah Kota Batu · Bagian Perekonomian dan SDA
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.15] mb-5">
              Sistem Informasi Manajemen <span className="text-gold-400">Seleksi</span> Organ BUMD
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-lg">
              Platform digital pengelolaan seleksi organ BUMD — mendukung proses seleksi Direksi, Dewan Pengawas,
              dan Komisaris BUMD secara terstruktur, profesional, aman, transparan, dan akuntabel.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#seleksi" className="bg-gold-500 text-navy-950 text-sm font-semibold rounded-md px-5 py-3 hover:bg-gold-400">Lihat Seleksi</a>
              <a href="#bumd" className="border border-white/20 text-white text-sm font-semibold rounded-md px-5 py-3 hover:bg-white/5">Informasi BUMD</a>
              <Link href="/login" className="bg-navy-800 border border-navy-600 text-white text-sm font-semibold rounded-md px-5 py-3 hover:bg-navy-700">Login</Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
            <div className="text-xs font-bold tracking-widest text-gold-400 uppercase mb-4">Alur Proses Seleksi</div>
            <ol className="space-y-3.5">
              {ALUR.map((step, i) => (
                <li key={step} className="flex items-center gap-3 pb-3.5 border-b border-dashed border-white/10 last:border-0 last:pb-0">
                  <span className="w-6 h-6 shrink-0 rounded-full border border-gold-400/60 text-gold-400 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-white/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* BUMD */}
      <section id="bumd" className="bg-white text-ink-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-gold-600 uppercase mb-2">BUMD & BLUD Kota Batu</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mb-8">Badan Usaha yang Dikelola</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bumds?.map((b) => (
              <div key={b.id} className="border border-gray-200 rounded-lg p-5 hover:border-navy-300 transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-navy-900">{b.nama}</h3>
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">{b.status}</span>
                </div>
                <p className="text-sm text-ink-500">{b.bidang_usaha}{b.tahun_berdiri ? ` · Berdiri ${b.tahun_berdiri}` : ""}</p>
              </div>
            )) ?? null}
            {!bumds?.length && <p className="text-sm text-ink-500">Data BUMD belum tersedia.</p>}
          </div>
        </div>
      </section>

      {/* Seleksi */}
      <section id="seleksi" className="bg-navy-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-gold-600 uppercase mb-2">Kesempatan Terbuka</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mb-8">Seleksi yang Sedang Membuka Pendaftaran</h2>

          {openSelections?.length ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {openSelections.map((s: any) => (
                <a key={s.id} href={`/daftar/${s.id}`} className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-navy-300 hover:shadow-sm transition">
                  <div className="font-display font-semibold text-navy-900 mb-1">{s.nama}</div>
                  <div className="text-xs text-ink-500 mb-3">{s.bumds?.nama} · {s.jabatan} · Tahun {s.tahun}</div>
                  <span className="text-[11px] font-semibold bg-gold-100 text-gold-700 px-2.5 py-1 rounded-full">Pendaftaran Dibuka →</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-ink-500">
              Belum ada seleksi yang membuka tahapan pendaftaran saat ini. Pantau <a href="#faq" className="text-navy-700 underline">pengumuman resmi</a> untuk informasi jadwal berikutnya.
            </div>
          )}
        </div>
      </section>

      {/* Regulasi */}
      <section id="regulasi" className="bg-white text-ink-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-gold-600 uppercase mb-2">Dasar Hukum</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mb-8">Regulasi Terkait</h2>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
            {regulations?.map((r, i) => (
              <div key={i} className="flex items-baseline gap-3 py-2.5 border-b border-gray-100">
                <span className="text-[11px] font-mono font-semibold text-gold-600 shrink-0">{r.kategori}</span>
                <span className="text-sm text-ink-700">{r.judul}{r.nomor ? ` — ${r.nomor}` : ""}{r.tahun ? ` (${r.tahun})` : ""}</span>
              </div>
            )) ?? null}
            {!regulations?.length && <p className="text-sm text-ink-500">Daftar regulasi belum tersedia.</p>}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-navy-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-gold-600 uppercase mb-2 text-center">Pertanyaan Umum</div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mb-10 text-center">FAQ</h2>
          <div className="space-y-5">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="font-semibold text-navy-900 text-sm mb-1.5">{item.q}</div>
                <p className="text-sm text-ink-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kontak / Footer */}
      <footer id="kontak" className="bg-navy-950 border-t border-white/10 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.3fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950 text-sm">S</div>
              <div className="font-display font-bold">SIMASEKSI</div>
            </div>
            <p className="text-sm text-white/60 max-w-md leading-relaxed">
              Sistem Informasi Manajemen Seleksi Organ BUMD — Pemerintah Kota Batu, Bagian Perekonomian dan Sumber
              Daya Alam. Dikembangkan untuk mendukung tata kelola BUMD yang profesional dan akuntabel.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest text-gold-400 uppercase mb-3">Kontak Sekretariat</div>
            {/* TODO(developer): ganti dengan alamat, telepon, dan email resmi Bagian
                Perekonomian dan SDA Kota Batu sebelum go-live — placeholder ini
                sengaja tidak diisi data nyata. */}
            <ul className="text-sm text-white/60 space-y-1.5">
              <li>Bagian Perekonomian dan SDA, Sekretariat Daerah Kota Batu</li>
              <li>[Alamat resmi — lengkapi sebelum publikasi]</li>
              <li>[Telepon resmi — lengkapi sebelum publikasi]</li>
              <li>[Email resmi — lengkapi sebelum publikasi]</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-white/10 text-xs text-white/40">
          © {new Date().getFullYear()} Pemerintah Kota Batu. Seluruh proses seleksi tunduk pada peraturan yang berlaku.
        </div>
      </footer>
    </main>
  );
}
