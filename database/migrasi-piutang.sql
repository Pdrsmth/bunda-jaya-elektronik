-- ============================================================
-- Migrasi: Piutang Pelanggan (Kredit Fleksibel)
-- Tanggal: 2026-10-07
-- Cara pakai: jalankan file ini di database toko_elektronik
-- (HeidiSQL: buka database toko_elektronik > File > Load SQL file > Execute)
-- ============================================================

CREATE TABLE IF NOT EXISTS piutang_pelanggan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaksi_id INT NOT NULL UNIQUE COMMENT 'Satu transaksi kredit = satu record piutang',
    pelanggan_nama VARCHAR(100) NOT NULL,
    pelanggan_kontak VARCHAR(30) NOT NULL,
    total_piutang DECIMAL(15,2) NOT NULL COMMENT 'Total transaksi penuh',
    uang_muka DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'DP saat checkout',
    sudah_dibayar DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total cicilan yang sudah dibayar',
    sisa_piutang DECIMAL(15,2) NOT NULL COMMENT 'total_piutang - sudah_dibayar',
    status ENUM('Belum Lunas', 'Lunas') NOT NULL DEFAULT 'Belum Lunas',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_status (status),
    INDEX idx_nama (pelanggan_nama),
    INDEX idx_sisa (sisa_piutang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pembayaran_piutang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    piutang_id INT NOT NULL,
    tanggal_bayar DATE NOT NULL,
    jumlah_bayar DECIMAL(15,2) NOT NULL COMMENT 'Bebas, kapan pun, berapa pun (<= sisa)',
    metode_bayar VARCHAR(20) NOT NULL COMMENT 'Tunai, Transfer, Kartu, QRIS',
    user_id INT NOT NULL COMMENT 'User yang mencatat pembayaran',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (piutang_id) REFERENCES piutang_pelanggan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_piutang (piutang_id),
    INDEX idx_tanggal_bayar (tanggal_bayar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
