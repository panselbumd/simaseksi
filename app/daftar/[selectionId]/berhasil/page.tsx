export default async function DaftarBerhasilPage({ searchParams }: { searchParams: Promise<{ reg?: string }> }) {
  const { reg } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h1 className="text-xl font-display font-bold text-navy-900 mb-2">Pendaftaran Berhasil</h1>
        <p className="text-sm text-ink-500 mb-4">
          Akun Peserta Anda telah dibuat dan data pendaftaran telah disimpan. Panitia Seleksi akan memverifikasi
          kelengkapan berkas Anda. Anda dapat memantau statusnya kapan saja setelah masuk.
        </p>
        {reg && (
          <div className="bg-navy-50 border border-navy-100 rounded-md p-4 mb-6">
            <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-1">Nomor Registrasi Anda</div>
            <div className="text-lg font-display font-bold text-navy-900 tracking-wide">{reg}</div>
            <p className="text-xs text-ink-500 mt-1">Simpan nomor ini. Kode Peserta akan diterbitkan otomatis oleh sistem setelah seluruh berkas persyaratan Anda dinyatakan memenuhi ketentuan oleh Panitia Seleksi.</p>
          </div>
        )}
        <a href="/login" className="block w-full rounded-md bg-navy-900 text-white font-semibold text-sm py-2.5 hover:bg-navy-800">
          Masuk ke Akun Saya
        </a>
      </div>
    </div>
  );
}
