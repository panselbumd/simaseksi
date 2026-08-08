import { PublicBackground } from "@/components/PublicBackground";

export default function DaftarBerhasilPage() {
  return (
    <PublicBackground>
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h1 className="text-xl font-display font-bold text-navy-900 mb-2">Pendaftaran Berhasil</h1>
        <p className="text-sm text-ink-500 mb-6">
          Akun Peserta Anda telah dibuat dan data pendaftaran telah disimpan. Panitia Seleksi akan memverifikasi
          kelengkapan berkas Anda. Anda dapat memantau statusnya kapan saja setelah masuk.
        </p>
        <a href="/login" className="block w-full rounded-md bg-navy-900 text-white font-semibold text-sm py-2.5 hover:bg-navy-800">
          Masuk ke Akun Saya
        </a>
      </div>
    </div>
    </PublicBackground>
  );
}
