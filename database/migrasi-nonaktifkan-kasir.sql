-- ============================================================
-- Migrasi: Nonaktifkan role Kasir
-- Tanggal: 2026-10-08
-- Cara pakai: jalankan file ini di database toko_elektronik
-- (HeidiSQL: buka database toko_elektronik > File > Load SQL file > Execute > F5)
--
-- Menghapus user 'kasir' agar role Kasir tidak bisa dipakai lagi.
-- Kasir merangkap admin: cukup pakai akun 'admin'.
--
-- CATATAN: jika muncul error foreign key, artinya user kasir pernah
-- dipakai mencatat transaksi — JANGAN dipaksa; kabari developer untuk
-- reassign manual.
-- ============================================================

DELETE FROM users WHERE username = 'kasir' AND role = 'Kasir';
