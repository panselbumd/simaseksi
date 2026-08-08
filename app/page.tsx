import Link from "next/link";

export default function PublicHome() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white flex items-center justify-center p-6">
      <div className="max-w-xl text-center">
        <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950 text-2xl mb-6">S</div>
        <h1 className="font-display text-4xl font-bold mb-3">SIMASEKSI</h1>
        <p className="text-slate-300 mb-8">Sistem Informasi Manajemen Seleksi Organ BUMD — Pemerintah Kota Batu. Versi ini berjalan di atas Next.js + Supabase (PostgreSQL, Auth, Storage, Row Level Security).</p>
        <Link href="/login" className="inline-block bg-gold-500 text-navy-950 font-semibold px-6 py-3 rounded-md hover:bg-gold-400">
          Masuk ke Sistem
        </Link>
      </div>
    </main>
  );
}
