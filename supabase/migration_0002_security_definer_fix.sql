-- ============================================================================
-- SIMASEKSI — Migration 0002
-- Untuk project yang sudah pernah menjalankan schema.sql SEBELUM perbaikan
-- ini ditambahkan. Jika ini instalasi baru, perbaikan ini SUDAH termasuk di
-- schema.sql — cukup jalankan schema.sql seperti biasa dan lewati file ini.
--
-- Memperbaiki Supabase Database Linter finding "security_definer_view" pada
-- public.v_candidate_ranking:
--   Sebuah VIEW di Postgres, tanpa security_invoker = true (PG 15+), berjalan
--   dengan hak akses PEMILIK view (biasanya role admin Supabase) — bukan hak
--   akses user yang men-query-nya. Itu setara efek SECURITY DEFINER dan bisa
--   memotong RLS. Perbaikan ini membuat view berjalan dengan hak akses user
--   yang men-query (security_invoker = true), sehingga RLS pada
--   candidates / assessment_components / assessment_scores tetap berlaku
--   normal untuk setiap pembaca — sama seperti definisi terbaru di schema.sql.
-- Jalankan di Supabase Dashboard -> SQL Editor. Aman dijalankan berulang kali.
-- ============================================================================

alter view public.v_candidate_ranking set (security_invoker = true);

-- Beritahu PostgREST agar refresh cache skema (tabel/relasi baru dari
-- migrasi ini langsung dikenali tanpa perlu restart manual).
NOTIFY pgrst, 'reload schema';
