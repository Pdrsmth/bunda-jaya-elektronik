-- ============================================
-- Database Schema: Sistem Informasi Toko Elektronik
-- Versi: 1.0
-- Tanggal: 28 September 2026
-- Database Engine: MySQL 5.7+
-- ============================================

-- Buat database
CREATE DATABASE IF NOT EXISTS toko_elektronik
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE toko_elektronik;

-- ============================================
-- Tabel: users
-- Deskripsi: Data user (Owner, Admin, Kasir)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password (bcrypt)',
    nama VARCHAR(100) NOT NULL,
    role ENUM('Owner', 'Admin', 'Kasir') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = akun dinonaktifkan Owner',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: kategori
-- Deskripsi: Kategori barang (Handphone, Laptop, TV, dll)
-- ============================================
CREATE TABLE kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: merek
-- Deskripsi: Merek barang (Apple, Samsung, LG, dll)
-- ============================================
CREATE TABLE merek (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: supplier
-- Deskripsi: Data supplier untuk pembelian barang
-- ============================================
CREATE TABLE supplier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(200) NOT NULL,
    kontak VARCHAR(50) NULL,
    alamat TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: barang
-- Deskripsi: Master data barang (produk yang dijual)
-- ============================================
CREATE TABLE barang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(20) NOT NULL UNIQUE COMMENT 'Kode barang unik',
    nama VARCHAR(200) NOT NULL,
    kategori_id INT NOT NULL,
    merek_id INT NOT NULL,
    satuan VARCHAR(20) NOT NULL DEFAULT 'Unit' COMMENT 'Unit, Pcs, Set',
    harga_beli DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Harga beli default per unit',
    harga_jual DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Harga jual per unit',
    stok INT NOT NULL DEFAULT 0 COMMENT 'Stok saat ini (real-time)',
    stok_minimum INT NOT NULL DEFAULT 1 COMMENT 'Batas minimum untuk alert',
    deskripsi TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (merek_id) REFERENCES merek(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_kode (kode),
    INDEX idx_nama (nama),
    INDEX idx_kategori (kategori_id),
    INDEX idx_merek (merek_id),
    INDEX idx_stok (stok),
    INDEX idx_stok_minimum (stok_minimum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: pembelian
-- Deskripsi: Header pembelian dari supplier
-- ============================================
CREATE TABLE pembelian (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor VARCHAR(50) NOT NULL UNIQUE COMMENT 'Format: BUY-YYYYMMDD-NNNN',
    tanggal DATE NOT NULL,
    supplier_id INT NOT NULL,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total pembelian',
    status_bayar ENUM('Lunas', 'Hutang') NOT NULL,
    metode_bayar VARCHAR(20) NULL COMMENT 'Tunai, Transfer, QRIS (jika lunas)',
    jatuh_tempo DATE NULL COMMENT 'Jatuh tempo hutang (jika status=Hutang)',
    user_id INT NOT NULL COMMENT 'Admin yang input',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    idempotency_key VARCHAR(64) NULL UNIQUE COMMENT 'Kunci anti double-submit dari client',
    FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_nomor (nomor),
    INDEX idx_tanggal (tanggal),
    INDEX idx_supplier (supplier_id),
    INDEX idx_status_bayar (status_bayar),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: pembelian_detail
-- Deskripsi: Detail item pembelian (per barang)
-- ============================================
CREATE TABLE pembelian_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pembelian_id INT NOT NULL,
    barang_id INT NOT NULL,
    jumlah INT NOT NULL COMMENT 'Jumlah barang dibeli',
    harga_beli DECIMAL(15,2) NOT NULL COMMENT 'Harga beli per unit (snapshot)',
    subtotal DECIMAL(15,2) NOT NULL COMMENT 'jumlah x harga_beli',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pembelian_id) REFERENCES pembelian(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_pembelian (pembelian_id),
    INDEX idx_barang (barang_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: hutang_supplier
-- Deskripsi: Tracking hutang ke supplier
-- ============================================
CREATE TABLE hutang_supplier (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pembelian_id INT NOT NULL UNIQUE COMMENT 'Satu pembelian = satu record hutang',
    supplier_id INT NOT NULL,
    total_hutang DECIMAL(15,2) NOT NULL COMMENT 'Total hutang awal',
    sudah_dibayar DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total yang sudah dibayar',
    sisa_hutang DECIMAL(15,2) NOT NULL COMMENT 'total_hutang - sudah_dibayar',
    jatuh_tempo DATE NOT NULL,
    status ENUM('Belum Lunas', 'Lunas') NOT NULL DEFAULT 'Belum Lunas',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pembelian_id) REFERENCES pembelian(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_supplier (supplier_id),
    INDEX idx_status (status),
    INDEX idx_jatuh_tempo (jatuh_tempo),
    INDEX idx_sisa_hutang (sisa_hutang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: pembayaran_hutang
-- Deskripsi: Histori pembayaran cicilan hutang
-- ============================================
CREATE TABLE pembayaran_hutang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hutang_id INT NOT NULL,
    tanggal_bayar DATE NOT NULL,
    jumlah_bayar DECIMAL(15,2) NOT NULL COMMENT 'Jumlah yang dibayar',
    metode_bayar VARCHAR(20) NOT NULL COMMENT 'Tunai, Transfer, Kartu',
    user_id INT NOT NULL COMMENT 'Admin yang input',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hutang_id) REFERENCES hutang_supplier(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_hutang (hutang_id),
    INDEX idx_tanggal_bayar (tanggal_bayar),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: transaksi
-- Deskripsi: Header transaksi penjualan (POS)
-- ============================================
CREATE TABLE transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor VARCHAR(50) NOT NULL UNIQUE COMMENT 'Format: TRX-YYYYMMDD-NNNN',
    tanggal DATETIME NOT NULL COMMENT 'Tanggal dan waktu transaksi',
    kasir_id INT NOT NULL COMMENT 'User yang melakukan transaksi',
    subtotal DECIMAL(15,2) NOT NULL COMMENT 'Total sebelum diskon',
    diskon_tipe ENUM('Nominal', 'Persen') NULL COMMENT 'Tipe diskon',
    diskon_nilai DECIMAL(15,2) NULL DEFAULT 0.00 COMMENT 'Nilai diskon (Rp atau %)',
    diskon_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal diskon dalam Rupiah',
    total DECIMAL(15,2) NOT NULL COMMENT 'Total setelah diskon',
    metode_bayar VARCHAR(20) NOT NULL COMMENT 'Tunai, Transfer, QRIS',
    jumlah_bayar DECIMAL(15,2) NOT NULL COMMENT 'Jumlah yang dibayar pelanggan',
    kembalian DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Kembalian (jika tunai)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    idempotency_key VARCHAR(64) NULL UNIQUE COMMENT 'Kunci anti double-submit dari client',
    FOREIGN KEY (kasir_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_nomor (nomor),
    INDEX idx_tanggal (tanggal),
    INDEX idx_kasir (kasir_id),
    INDEX idx_metode_bayar (metode_bayar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: transaksi_detail
-- Deskripsi: Detail item transaksi penjualan (per barang)
-- ============================================
CREATE TABLE transaksi_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaksi_id INT NOT NULL,
    barang_id INT NOT NULL,
    jumlah INT NOT NULL COMMENT 'Jumlah barang dijual',
    harga_jual DECIMAL(15,2) NOT NULL COMMENT 'Harga jual per unit (snapshot)',
    harga_beli DECIMAL(15,2) NOT NULL COMMENT 'Harga beli per unit (snapshot, untuk hitung laba)',
    subtotal DECIMAL(15,2) NOT NULL COMMENT 'jumlah x harga_jual',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (barang_id) REFERENCES barang(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_transaksi (transaksi_id),
    INDEX idx_barang (barang_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: kas
-- Deskripsi: Laporan kas harian (opsional untuk MVP)
-- ============================================
CREATE TABLE kas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL UNIQUE COMMENT 'Tanggal kas',
    saldo_awal DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Saldo awal hari ini',
    kas_masuk DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total kas masuk (penjualan tunai)',
    kas_keluar DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total kas keluar (pembelian tunai)',
    saldo_akhir DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'saldo_awal + kas_masuk - kas_keluar',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Data Default
-- ============================================

-- User default (password: "password123" - hashed dengan bcrypt)
-- CATATAN: Ganti password setelah login pertama!
-- (Role Kasir dinonaktifkan: kasir merangkap admin, cukup pakai akun Admin)
INSERT INTO users (username, password, nama, role) VALUES
('owner', '$2b$10$ZYiXvflVhql56xLpk7fLnuufDGvneaGeLX.KQaYmL/20zk1exlL2.', 'Owner Toko', 'Owner'),
('admin', '$2b$10$ZYiXvflVhql56xLpk7fLnuufDGvneaGeLX.KQaYmL/20zk1exlL2.', 'Admin Toko', 'Admin');

-- Kategori default
INSERT INTO kategori (nama, deskripsi) VALUES
('Handphone', 'Smartphone dan HP'),
('Laptop', 'Laptop dan Notebook'),
('TV', 'Televisi semua ukuran'),
('AC', 'Air Conditioner'),
('Aksesoris', 'Aksesoris elektronik (charger, case, dll)'),
('Spare Part', 'Komponen dan spare part');

-- Merek default
INSERT INTO merek (nama) VALUES
('Apple'),
('Samsung'),
('Xiaomi'),
('Oppo'),
('Vivo'),
('LG'),
('Sony'),
('Polytron'),
('Panasonic'),
('Sharp'),
('Asus'),
('Lenovo'),
('HP'),
('Dell'),
('Acer');

-- Kas awal (saldo awal toko)
-- CATATAN: Sesuaikan dengan kas awal real toko Anda
INSERT INTO kas (tanggal, saldo_awal, kas_masuk, kas_keluar, saldo_akhir) VALUES
(CURDATE(), 5000000.00, 0.00, 0.00, 5000000.00);

-- ============================================
-- Views untuk Reporting (Helper)
-- ============================================

-- View: Barang dengan info kategori dan merek
CREATE OR REPLACE VIEW v_barang AS
SELECT 
    b.id,
    b.kode,
    b.nama,
    k.nama AS kategori,
    m.nama AS merek,
    b.satuan,
    b.harga_beli,
    b.harga_jual,
    b.stok,
    b.stok_minimum,
    b.deskripsi,
    b.created_at,
    b.updated_at,
    CASE 
        WHEN b.stok <= 0 THEN 'Habis'
        WHEN b.stok <= b.stok_minimum THEN 'Menipis'
        ELSE 'Aman'
    END AS status_stok
FROM barang b
JOIN kategori k ON b.kategori_id = k.id
JOIN merek m ON b.merek_id = m.id;

-- View: Hutang supplier yang belum lunas
CREATE OR REPLACE VIEW v_hutang_aktif AS
SELECT 
    h.id,
    s.nama AS supplier,
    p.nomor AS nomor_pembelian,
    p.tanggal AS tanggal_pembelian,
    h.total_hutang,
    h.sudah_dibayar,
    h.sisa_hutang,
    h.jatuh_tempo,
    CASE 
        WHEN h.jatuh_tempo < CURDATE() THEN 'Terlambat'
        WHEN h.jatuh_tempo = CURDATE() THEN 'Jatuh Tempo Hari Ini'
        WHEN h.jatuh_tempo <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 'Segera Jatuh Tempo'
        ELSE 'Belum Jatuh Tempo'
    END AS status_tempo
FROM hutang_supplier h
JOIN supplier s ON h.supplier_id = s.id
JOIN pembelian p ON h.pembelian_id = p.id
WHERE h.status = 'Belum Lunas'
ORDER BY h.jatuh_tempo ASC;

-- View: Transaksi dengan info kasir
CREATE OR REPLACE VIEW v_transaksi AS
SELECT 
    t.id,
    t.nomor,
    t.tanggal,
    u.nama AS kasir,
    t.subtotal,
    t.diskon_amount,
    t.total,
    t.metode_bayar,
    t.jumlah_bayar,
    t.kembalian,
    t.created_at
FROM transaksi t
JOIN users u ON t.kasir_id = u.id;

-- ============================================
-- Stored Procedures (Helper Functions)
-- ============================================

-- Procedure: Generate nomor transaksi otomatis
DELIMITER //
CREATE PROCEDURE sp_generate_nomor_transaksi(OUT nomor_baru VARCHAR(50))
BEGIN
    DECLARE tanggal_str VARCHAR(8);
    DECLARE counter INT;
    
    SET tanggal_str = DATE_FORMAT(CURDATE(), '%Y%m%d');
    
    SELECT COUNT(*) + 1 INTO counter
    FROM transaksi
    WHERE DATE(tanggal) = CURDATE();
    
    SET nomor_baru = CONCAT('TRX-', tanggal_str, '-', LPAD(counter, 4, '0'));
END //
DELIMITER ;

-- Procedure: Generate nomor pembelian otomatis
DELIMITER //
CREATE PROCEDURE sp_generate_nomor_pembelian(OUT nomor_baru VARCHAR(50))
BEGIN
    DECLARE tanggal_str VARCHAR(8);
    DECLARE counter INT;
    
    SET tanggal_str = DATE_FORMAT(CURDATE(), '%Y%m%d');
    
    SELECT COUNT(*) + 1 INTO counter
    FROM pembelian
    WHERE tanggal = CURDATE();
    
    SET nomor_baru = CONCAT('BUY-', tanggal_str, '-', LPAD(counter, 4, '0'));
END //
DELIMITER ;

-- ============================================
-- Indexes untuk Performa Query
-- ============================================

-- Index composite untuk query laporan penjualan harian
CREATE INDEX idx_transaksi_tanggal_metode ON transaksi(tanggal, metode_bayar);

-- Index composite untuk query barang terlaris
CREATE INDEX idx_transaksi_detail_composite ON transaksi_detail(transaksi_id, barang_id);

-- Index untuk query stok menipis
CREATE INDEX idx_barang_stok_composite ON barang(stok, stok_minimum);

-- ============================================
-- Tabel: piutang_pelanggan (Kredit Fleksibel)
-- (QA-4 BUG-11: dipindah dari migrasi agar fresh install self-contained)
-- ============================================
CREATE TABLE piutang_pelanggan (
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

-- ============================================
-- Tabel: pembayaran_piutang (riwayat cicilan)
-- ============================================
CREATE TABLE pembayaran_piutang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    piutang_id INT NOT NULL,
    tanggal_bayar DATE NOT NULL,
    jumlah_bayar DECIMAL(15,2) NOT NULL COMMENT 'Bebas, kapan pun, berapa pun (<= sisa)',
    metode_bayar VARCHAR(20) NOT NULL COMMENT 'Tunai, Transfer, QRIS',
    user_id INT NOT NULL COMMENT 'User yang mencatat pembayaran',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (piutang_id) REFERENCES piutang_pelanggan(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_piutang (piutang_id),
    INDEX idx_tanggal_bayar (tanggal_bayar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel: login_attempts (rate-limit login, anti brute-force)
-- ============================================
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    username VARCHAR(50) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    last_attempt DATETIME NOT NULL,
    UNIQUE KEY uq_ip_user (ip, username),
    INDEX idx_last_attempt (last_attempt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Selesai
-- ============================================
-- Database schema berhasil dibuat!
-- 
-- Login default:
-- - Username: owner | Password: password123 | Role: Owner
-- - Username: admin | Password: password123 | Role: Admin
--
-- PENTING: Ganti password setelah login pertama!
-- ============================================
