-- ============================================================
-- Migrasi: Pengerasan keamanan (2026-10-08) — revisi MySQL
-- Cara pakai: copy SEMUA isi file ini > paste di tab Query HeidiSQL
-- (database toko_elektronik) > Execute / F9
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- 1. Status aktif user: nonaktifkan akun tanpa hapus baris
--    (MySQL tidak mendukung ADD COLUMN IF NOT EXISTS, jadi cek manual)
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'is_active'
);
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tabel rate-limit login: blokir brute-force
--    5x gagal dalam 15 menit -> kunci 15 menit (per IP + username)
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    username VARCHAR(50) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    last_attempt DATETIME NOT NULL,
    UNIQUE KEY uq_ip_user (ip, username),
    INDEX idx_last_attempt (last_attempt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
