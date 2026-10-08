-- ============================================================
-- Migrasi: Hapus trigger stok/hutang (2026-10-08)
-- Alasan: logika trigger dipindah ke PHP agar aplikasi jalan di
-- hosting tanpa hak TRIGGER (mis. InfinityFree free tier).
-- WAJIB dijalankan di database LAMA yang masih punya trigger,
-- kalau tidak stok akan double-update (trigger + PHP).
-- Aman dijalankan ulang (IF EXISTS).
-- Cara pakai: HeidiSQL > database toko_elektronik > paste > F9
-- ============================================================

DROP TRIGGER IF EXISTS trg_after_pembelian_detail_insert;
DROP TRIGGER IF EXISTS trg_after_transaksi_detail_insert;
DROP TRIGGER IF EXISTS trg_after_pembayaran_hutang_insert;
