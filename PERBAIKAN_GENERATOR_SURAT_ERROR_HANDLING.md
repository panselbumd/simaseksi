# Generator Surat — penanganan error diperkuat total — 11 Agustus 2026

Karena error "Server Components render... pesan disembunyikan" masih
muncul meskipun perbaikan `searchParams` sebelumnya sudah diterapkan
(kemungkinan Anda menguji sebelum sempat redeploy zip terakhir, atau ada
penyebab lain yang belum ketahuan), kali ini saya lakukan pendekatan yang
lebih menyeluruh: **membuat halaman ini benar-benar tidak bisa lagi
menampilkan error tersembunyi**, apa pun penyebab aslinya.

## Perubahan

1. **`app/(app)/letters/page.tsx` — seluruh isi dibungkus `try/catch`.**
   Sebelumnya, kalau ada query Supabase manapun yang gagal (`profiles`,
   `selections`, atau `letters`), errornya akan langsung "meledak" saat
   render dan Next.js menyembunyikan pesannya (persis gejala yang Anda
   laporkan). Sekarang setiap query diperiksa errornya secara eksplisit,
   dan kalau ada yang gagal, halaman menampilkan **kotak merah dengan
   pesan error asli dari Supabase** — bukan layar generik yang tidak bisa
   dibaca.

2. **`app/(app)/letters/error.tsx` — lapisan pengaman terakhir (baru).**
   Kalau ternyata masih ada sesuatu yang lolos dari try/catch di atas
   (error boundary Next.js selalu jadi jaring pengaman terakhir untuk
   Server Component), sekarang muncul halaman yang jelas: judul "Generator
   Surat gagal dimuat", penjelasan bahwa draf yang baru disimpan
   kemungkinan besar tetap aman tersimpan, **kode digest error ditampilkan
   di layar** (bukan cuma di log Vercel yang perlu dibuka manual), dan
   tombol "Coba Lagi".

## Kenapa ini penting sekarang

Dengan kedua lapisan ini, **kalau errornya masih muncul setelah Anda
redeploy versi ini, pesannya sendiri sekarang akan terlihat jelas di
layar** (bukan disensor) — jadi langkah selanjutnya jadi jauh lebih
mudah: tinggal salin pesan/kode digest yang tampil dan kirim ke saya,
tidak perlu lagi bolak-balik ke Vercel Logs.

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses — 30
route ter-generate tanpa error.

## Penting: pastikan versi ini benar-benar ter-deploy

Mengingat kejadian sebelumnya (file lama tidak ikut terhapus saat
disalin manual ke GitHub), sekali lagi disarankan: **ganti seluruh isi
folder proyek dengan isi zip ini**, bukan menimpa file satu-satu, supaya
tidak ada kemungkinan file lama yang tertinggal.
