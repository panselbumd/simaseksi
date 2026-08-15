# Perubahan — 15 Agustus 2026 (lanjutan): Daftar Hadir, Edit Redaksi Bebas, Naskah Kustom

Lanjutan dari `PERUBAHAN_2026-08-15-identitas-panitia.md`. Tiga penambahan:

## 1. Daftar Hadir sebagai halaman cetak terpisah

Lampiran L-01 pada paket naskah dinas — dipakai berulang di hampir semua
Berita Acara (rapat persiapan, UKK, presentasi & wawancara, dst).

- **Migrasi baru:** `supabase/migration_0010_daftar_hadir_dan_naskah_kustom.sql`
  menambahkan tabel `attendance_sheets` (judul kegiatan, tanggal, tempat,
  jumlah baris kosong, opsional dikaitkan ke satu surat/Berita Acara).
- **Halaman cetak baru:** `/daftar-hadir/[id]` — kop surat, judul "Daftar
  Hadir", info kegiatan, lalu tabel No/Nama/Jabatan-Unsur/Instansi/Tanda
  Tangan. Baris Ketua/Sekretaris/Anggota/Tim UKK **diisi otomatis** dari
  `lib/letter-signature.ts` (sumber yang sama dipakai tanda tangan surat),
  diikuti baris kosong untuk peserta/tamu yang hadir mengisi & tanda
  tangan langsung saat kegiatan.
- **Dibuat & dikelola dari** halaman "Cetak / Unduh Surat" per seleksi
  (`/selections/[id]/surat`) — bagian baru di bawah daftar surat, dengan
  form buat + daftar Daftar Hadir yang sudah dibuat.

## 2. Edit redaksi naskah dinas langsung di aplikasi

**Sebelumnya:** isi (`isi`) surat selalu dihitung ulang otomatis dari
template setiap kali disimpan — Panitia hanya bisa mengubah data
(nomor/tanggal/nama peserta/periode), bukan kalimat/redaksinya sendiri.

**Sekarang:** baik di Generator Surat maupun Ubah Surat, ada kolom **"Isi
Naskah"** (textarea) yang bisa diedit bebas. Saat jenis surat dipilih/
diganti, kolom ini otomatis terisi dari template — setelah itu sepenuhnya
di tangan Panitia. Tombol **"↻ Isi ulang dari template"** mengembalikan ke
redaksi baku kapan saja (berguna kalau nomor/tanggal/dst diubah setelah
redaksi disunting). Nilai yang tersimpan adalah persis apa yang ada di
kolom tsb — server tidak lagi menimpanya secara otomatis.

## 3. Naskah Dinas Kustom — buat naskah dari kosong

Jenis Surat sekarang punya opsi **"✎ Naskah Dinas Kustom"** di paling atas
dropdown. Saat dipilih, Panitia menentukan sendiri:

- **Judul/Nama Naskah** (wajib),
- **Bentuk Naskah** — Surat biasa (Nomor/Perihal, korespondensi) atau
  Judul di tengah (gaya Berita Acara/Pengumuman),
- **Judul Dinas** & **Tentang** (untuk bentuk "Judul di tengah"),
- **Bentuk Tanda Tangan** — Ketua saja / Tabel 5 orang / Blok 3 kolom /
  Peserta,
- dan menulis **redaksi lengkap** dari kosong di kolom Isi Naskah.

Halaman Cetak, unduh Word, dan unduh PDF otomatis mengenali naskah kustom
lewat `resolveTemplate()` (baru, di `lib/letter-templates.ts`) dan
merender persis seperti naskah dari katalog — kop surat, judul/tentang,
paragraf, dan blok tanda tangan yang dipilih.

- **Migrasi:** kolom `custom_judul`, `custom_tentang`, `custom_layout`,
  `custom_signature` ditambahkan ke `letters` (lihat migration_0010, sama
  dengan migrasi Daftar Hadir di atas).

## Yang perlu dilakukan sebelum deploy

1. Jalankan `supabase/migration_0010_daftar_hadir_dan_naskah_kustom.sql`
   di Supabase SQL Editor (aman dijalankan berkali-kali; bisa dijalankan
   bersamaan/setelah migration_0009).
2. Ganti seluruh folder proyek di GitHub seperti biasa (jangan overlay
   sebagian file).
