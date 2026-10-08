-- ============================================================
-- Migrasi: Idempotency Key (anti double submit)
-- Tanggal: 2026-10-08
-- CATATAN: kolom ini SUDAH masuk schema.sql (fresh install tidak perlu
-- menjalankan file ini). File ini hanya untuk database lama yang dibuat
-- sebelum 2026-10-08.
-- Cara pakai: jalankan file ini di database toko_elektronik
-- (HeidiSQL: buka database toko_elektronik > File > Load SQL file > Execute > F5)
-- Aman dijalankan ulang (idempotent) — kolom yang sudah ada dilewati otomatis.
-- (UNIQUE memperbolehkan banyak NULL, jadi data lama tidak konflik.)
-- ============================================================

-- transaksi.idempotency_key
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'transaksi'
      AND COLUMN_NAME = 'idempotency_key'
);
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE transaksi ADD COLUMN idempotency_key VARCHAR(64) NULL UNIQUE COMMENT ''Kunci anti double-submit dari client''',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- pembelian.idempotency_key
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'pembelian'
      AND COLUMN_NAME = 'idempotency_key'
);
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE pembelian ADD COLUMN idempotency_key VARCHAR(64) NULL UNIQUE COMMENT ''Kunci anti double-submit dari client''',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
