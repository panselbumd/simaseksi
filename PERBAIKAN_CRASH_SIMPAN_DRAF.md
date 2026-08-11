# Perbaikan crash "Simpan Draf" — 11 Agustus 2026

## Kemungkinan besar penyebab error "An error occurred in the Server
## Components render" saat menekan "Simpan Draf"

Ini adalah error render Server Component (bukan error dari aksi
simpan-nya sendiri — Next.js sengaja menampilkan pesan generik seperti
ini khusus untuk error yang terjadi saat me-render komponen server,
berbeda dari error di dalam Server Action yang pesannya biasanya tetap
tampil apa adanya).

**Urutan kejadian:** tombol "Simpan Draf" berhasil memanggil aksi
penyimpanan di server, lalu halaman otomatis di-refresh
(`router.refresh()` — perbaikan dari sesi sebelumnya). Refresh ini
membuat Next.js me-render ulang halaman `/letters` dari server. Pada
sesi sebelumnya saya menambahkan parameter `searchParams` ke halaman ini
(untuk fitur "bawa seleksi terpilih dari Manajemen Seleksi") dengan cara:

```ts
const { selection: preselectedSelectionId } = await searchParams;
```

Kalau `searchParams` yang diberikan Next.js ternyata `undefined` (bisa
terjadi pada refresh tanpa query string, tergantung skenario navigasi),
baris di atas akan melempar error
`Cannot destructure property 'selection' of undefined` — dan karena ini
terjadi di dalam render Server Component, Next.js menyembunyikan pesan
aslinya dan hanya menampilkan pesan generik yang Anda lihat. Draf
suratnya sendiri kemungkinan **sudah tersimpan** ke database sebelum
error ini muncul — errornya terjadi setelahnya, saat me-refresh
tampilan.

## Perbaikan

`app/(app)/letters/page.tsx` sekarang menangani kemungkinan
`searchParams` kosong/`undefined` dengan aman:

```ts
const resolvedSearchParams = (await searchParams) ?? {};
const preselectedSelectionId = resolvedSearchParams.selection;
```

---

Sudah dicek: `npx tsc --noEmit` bersih dan `npm run build` sukses — 30
route ter-generate tanpa error.

## Kalau setelah ini masih muncul error yang sama

Errornya sekarang seharusnya tidak lagi menyembunyikan pesan asli untuk
kasus di atas. Kalau masih terjadi, tolong buka **Vercel Dashboard →
project ini → tab Logs (Runtime Logs)** tepat setelah menekan "Simpan
Draf" — di sana pesan error yang sebenarnya (bukan versi yang
disensor untuk pengguna) akan tercatat lengkap dengan digest-nya. Kirimkan
teks itu ke saya supaya saya bisa langsung menunjuk baris kode yang
bermasalah, alih-alih menerka-nerka dari gejala di layar pengguna.
