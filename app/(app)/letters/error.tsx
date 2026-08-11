"use client";

import { useEffect } from "react";

export default function LettersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced in the browser console too, in case someone has devtools open.
    console.error("Generator Surat render error:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto mt-16 bg-white border border-red-200 rounded-md p-6 text-center">
      <h1 className="text-lg font-display font-bold text-red-700 mb-2">Generator Surat gagal dimuat</h1>
      <p className="text-sm text-ink-700 mb-4">
        Terjadi kesalahan saat memuat halaman ini. Draf yang baru Anda simpan (jika ada) kemungkinan besar
        tetap tersimpan — masalahnya ada pada saat menampilkan ulang halaman, bukan pada penyimpanannya.
      </p>
      {error.digest && (
        <p className="text-xs text-ink-500 mb-4">
          Kode error (digest) untuk dilaporkan ke pengembang: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{error.digest}</code>
        </p>
      )}
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="text-sm bg-navy-900 text-white font-semibold rounded-md px-4 py-2">
          Coba Lagi
        </button>
        <a href="/letters" className="text-sm border border-gray-200 rounded-md px-4 py-2">Muat Ulang Halaman</a>
      </div>
    </div>
  );
}
