"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs bg-white text-navy-900 font-semibold rounded-md px-3 py-1.5"
    >
      Cetak / Simpan sebagai PDF
    </button>
  );
}
