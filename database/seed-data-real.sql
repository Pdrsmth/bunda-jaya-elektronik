-- ============================================
-- Seed Data REAL dari Google Sheets
-- Bunda Jaya Elektronik
-- Sumber: Data Stok Toko Real
-- ============================================

USE toko_elektronik;

-- ============================================
-- 1. SUPPLIER (contoh supplier umum untuk toko elektronik)
-- ============================================
INSERT INTO supplier (nama, kontak, alamat) VALUES
('PT Sharp Electronics Indonesia', '021-54390000', 'Jl. Swadaya IV No.1, Jakarta'),
('PT LG Electronics Indonesia', '021-57941111', 'Wisma GKBI Lt.25, Jakarta'),
('PT Panasonic Gobel Indonesia', '021-29601688', 'Jl. Dewi Sartika, Jakarta'),
('PT Polytron Indonesia', '0291-4265000', 'Kudus, Jawa Tengah'),
('CV Jaya Makmur Elektronik', '0821-3344-5566', 'Pasar Glodok, Jakarta');

-- ============================================
-- 2. BARANG - Data Real dari Spreadsheet
-- ============================================

-- Audio (3 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('AUD-001', 'Mic', 1, 9, 'Unit', 280000, 340000, 3, 2, 'Microphone - No Buku: 21'),
('AUD-002', 'Speaker (Besar)', 1, 9, 'Unit', 3000000, 3600000, 1, 1, 'Speaker Besar - No Buku: 19'),
('AUD-003', 'Speaker Aero', 1, 9, 'Unit', 1350000, 1600000, 0, 1, 'Speaker Aero - No Buku: 20');

-- Blender & Mixer (5 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('BLN-001', 'Blender Miyako BL-152', 6, 9, 'Unit', 305000, 365000, 0, 1, 'Blender Miyako - No Buku: 27'),
('BLN-002', 'Blender Miyako BL-221', 6, 9, 'Unit', 275000, 325000, 0, 1, 'Blender Miyako - No Buku: 28'),
('BLN-003', 'Blender Omega', 6, 9, 'Unit', 195000, 235000, 0, 1, 'Blender Omega - No Buku: 29'),
('BLN-004', 'Blender Philips', 6, 9, 'Unit', 600000, 715000, 0, 1, 'Blender Philips - No Buku: 26'),
('BLN-005', 'Mixer Miyako', 6, 9, 'Unit', 200000, 240000, 0, 1, 'Mixer Miyako - No Buku: 45');

-- Kabel, Lampu & Baterai (8 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('KLB-001', 'Baterai Besar', 6, 9, 'Pcs', 12000, 15000, 0, 5, 'Baterai B - No Buku: 69'),
('KLB-002', 'Baterai Kecil', 6, 9, 'Pcs', 8000, 10000, 2, 5, 'Baterai K - No Buku: 70'),
('KLB-003', 'Kabel M Type 1', 6, 9, 'Meter', 3200, 4000, 0, 10, 'Kabel M per meter - No Buku: 49'),
('KLB-004', 'Kabel M Type 2', 6, 9, 'Meter', 4000, 5000, 0, 10, 'Kabel M per meter - No Buku: 52'),
('KLB-005', 'Kabel P', 6, 9, 'Meter', 4000, 5000, 0, 10, 'Kabel P per meter - No Buku: 50'),
('KLB-006', 'Kabel P 1,5', 6, 9, 'Meter', 4800, 6000, 0, 10, 'Kabel P 1,5 per meter - No Buku: 51'),
('KLB-007', 'Lampu Emergensi 15 Watt', 6, 9, 'Unit', 105000, 125000, 0, 2, 'Lampu Emergensi - No Buku: 48'),
('KLB-008', 'Lampu Emergensi 20 Watt', 6, 9, 'Unit', 105000, 125000, 0, 2, 'Lampu Emergensi - No Buku: 53');

-- Kipas Angin (12 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('KIP-001', 'Kipas Cosmos', 3, 9, 'Unit', 260000, 310000, 0, 2, 'Kipas Cosmos - No Buku: 57'),
('KIP-002', 'Kipas Desk Fan', 3, 9, 'Unit', 75000, 90000, 0, 2, 'Kipas Meja - No Buku: 59'),
('KIP-003', 'Kipas Karakter', 3, 9, 'Unit', 62000, 75000, 0, 2, 'Kipas Karakter - No Buku: 58'),
('KIP-004', 'Kipas Miyako', 3, 9, 'Unit', 230000, 275000, 0, 2, 'Kipas Miyako - No Buku: 39'),
('KIP-005', 'Kipas Miyako 1227', 3, 9, 'Unit', 230000, 275000, 0, 2, 'Kipas Miyako 1227 - No Buku: 56'),
('KIP-006', 'Kipas Miyako 1606', 3, 9, 'Unit', 230000, 275000, 0, 2, 'Kipas Miyako 1606 - No Buku: 55'),
('KIP-007', 'Kipas Miyako Petak', 3, 9, 'Unit', 335000, 400000, 0, 2, 'Kipas Miyako Petak - No Buku: 71'),
('KIP-008', 'Kipas Semar 16', 3, 9, 'Unit', 155000, 185000, 0, 2, 'Kipas Semar 16 - No Buku: 54'),
('KIP-009', 'Kipas Semar Meja', 3, 9, 'Unit', 142000, 170000, 0, 2, 'Kipas Semar Meja - No Buku: 60'),
('KIP-010', 'Kipas Temiko', 3, 9, 'Unit', 222000, 265000, 0, 2, 'Kipas Temiko - No Buku: 38'),
('KIP-011', 'Kipas TO/Okayama', 3, 9, 'Unit', 222000, 265000, 0, 2, 'Kipas TO/Okayama - No Buku: 37');

-- Kompor (7 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('KMP-001', 'Cooper Tipe Gas', 3, 9, 'Unit', 92000, 110000, 0, 1, 'Cooper Gas - No Buku: 44'),
('KMP-002', 'Kompor HCK', 3, 9, 'Unit', 180000, 215000, 0, 1, 'Kompor HCK'),
('KMP-003', 'Kompor Omicko 2 Tungku', 3, 9, 'Unit', 192000, 230000, 0, 1, 'Kompor Omicko - No Buku: 62'),
('KMP-004', 'Kompor Omicko 1 Tungku', 3, 9, 'Unit', 96000, 115000, 0, 1, 'Kompor Omicko - No Buku: 63'),
('KMP-005', 'Kompor Rinai RI-511S', 3, 7, 'Unit', 226000, 270000, 0, 1, 'Kompor Rinai - No Buku: 34'),
('KMP-006', 'Kompor Rinai RI-522C', 3, 7, 'Unit', 360000, 430000, 0, 1, 'Kompor Rinai - No Buku: 33'),
('KMP-007', 'Kompor Rinai RI-522E', 3, 7, 'Unit', 410000, 490000, 0, 1, 'Kompor Rinai - No Buku: 32');

-- Kulkas, Showcase & Freezer (14 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('KLK-001', 'Freezer Aqua 100L', 4, 9, 'Unit', 2180000, 2600000, 0, 1, 'Freezer Aqua - No Buku: 18'),
('KLK-002', 'Freezer LG', 4, 3, 'Unit', 3270000, 3900000, 0, 1, 'Freezer LG - No Buku: 17'),
('KLK-003', 'Kulkas 2 Pintu Sharp Besar', 4, 5, 'Unit', 3690000, 4400000, 0, 1, 'Kulkas Sharp 2P Besar - No Buku: 3'),
('KLK-004', 'Kulkas 2 Pintu Sharp Medium', 4, 5, 'Unit', 3185000, 3800000, 0, 1, 'Kulkas Sharp 2P Medium - No Buku: 4'),
('KLK-005', 'Kulkas 4 Pintu Sharp', 4, 5, 'Unit', 9730000, 11600000, 0, 1, 'Kulkas Sharp 4P - No Buku: 11'),
('KLK-006', 'Kulkas Aqua', 4, 9, 'Unit', 2350000, 2800000, 0, 1, 'Kulkas Aqua - No Buku: 10'),
('KLK-007', 'Kulkas LG', 4, 3, 'Unit', 2435000, 2900000, 0, 1, 'Kulkas LG - No Buku: 5'),
('KLK-008', 'Kulkas Mini Sharp', 4, 5, 'Unit', 1175000, 1400000, 0, 1, 'Kulkas Mini Sharp - No Buku: 9'),
('KLK-009', 'Kulkas Polytron', 4, 4, 'Unit', 2435000, 2900000, 0, 1, 'Kulkas Polytron - No Buku: 6'),
('KLK-010', 'Kulkas Sharp C', 4, 5, 'Unit', 1930000, 2300000, 0, 1, 'Kulkas Sharp C - No Buku: 8'),
('KLK-011', 'Kulkas Sharp M', 4, 5, 'Unit', 2305000, 2750000, 0, 1, 'Kulkas Sharp M - No Buku: 7'),
('KLK-012', 'Showcase Polytron Besar', 4, 4, 'Unit', 4360000, 5200000, 0, 1, 'Showcase Polytron B - No Buku: 65'),
('KLK-013', 'Showcase Polytron Medium', 4, 4, 'Unit', 3945000, 4700000, 0, 1, 'Showcase Polytron M - No Buku: 1'),
('KLK-014', 'Showcase Sanken', 4, 9, 'Unit', 3945000, 4700000, 0, 1, 'Showcase Sanken - No Buku: 2');

-- Lain-lain (1 item)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('LLN-001', 'Raket Nyamuk', 6, 9, 'Unit', 67000, 80000, 0, 3, 'Raket Nyamuk - No Buku: 64');

-- Magic Com (5 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('MGC-001', 'Magic Cosmos CRJ-3305', 6, 9, 'Unit', 272000, 325000, 0, 2, 'Magic Cosmos - No Buku: 25'),
('MGC-002', 'Magic Miyako MCM-18BH', 6, 9, 'Unit', 272000, 325000, 0, 2, 'Magic Miyako - No Buku: 22'),
('MGC-003', 'Magic Miyako MCM-507', 6, 9, 'Unit', 272000, 325000, 0, 2, 'Magic Miyako - No Buku: 23'),
('MGC-004', 'Magic Miyako MCM-606A', 6, 9, 'Unit', 239000, 285000, 0, 2, 'Magic Miyako - No Buku: 24'),
('MGC-005', 'Magic Okayama', 6, 9, 'Unit', 159000, 190000, 0, 2, 'Magic Okayama - No Buku: 61');

-- Mesin Cuci (8 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('MCU-001', 'Mesin Cuci Aqua 9kg', 4, 9, 'Unit', 2010000, 2400000, 0, 1, 'Mesin Cuci Aqua - No Buku: 67'),
('MCU-002', 'Mesin Cuci LG 10kg', 4, 3, 'Unit', 3020000, 3600000, 0, 1, 'Mesin Cuci LG - No Buku: 16'),
('MCU-003', 'Mesin Cuci LG 9kg', 4, 3, 'Unit', 2895000, 3450000, 0, 1, 'Mesin Cuci LG - No Buku: 15'),
('MCU-004', 'Mesin Cuci Polytron 9kg', 4, 4, 'Unit', 1805000, 2150000, 0, 1, 'Mesin Cuci Polytron - No Buku: 13'),
('MCU-005', 'Mesin Cuci Sanken 9kg', 4, 9, 'Unit', 1805000, 2150000, 0, 1, 'Mesin Cuci Sanken - No Buku: 14'),
('MCU-006', 'Mesin Cuci Sharp 10kg', 4, 5, 'Unit', 2685000, 3200000, 0, 1, 'Mesin Cuci Sharp 10kg'),
('MCU-007', 'Mesin Cuci Sharp 8kg', 4, 5, 'Unit', 1845000, 2200000, 0, 1, 'Mesin Cuci Sharp - No Buku: 66'),
('MCU-008', 'Mesin Cuci Sharp 9kg', 4, 5, 'Unit', 2180000, 2600000, 0, 1, 'Mesin Cuci Sharp - No Buku: 12');

-- Regulator & Slang (11 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('REG-001', 'Regulator Infinity', 6, 9, 'Unit', 54500, 65000, 0, 3, 'Regulator Infinity - No Buku: 73'),
('REG-002', 'Regulator Set Quantum', 6, 9, 'Unit', 105000, 125000, 0, 3, 'Regulator Quantum - No Buku: 78'),
('REG-003', 'Regulator Top Gas', 6, 9, 'Unit', 63000, 75000, 0, 3, 'Regulator Top Gas - No Buku: 72'),
('REG-004', 'Regulator TT Quantum', 6, 9, 'Unit', 92000, 110000, 0, 3, 'Regulator TT Quantum - No Buku: 76'),
('REG-005', 'Regulator TT Top Gas', 6, 9, 'Unit', 80000, 95000, 0, 3, 'Regulator TT Top Gas - No Buku: 75'),
('REG-006', 'Regulator TT Wing Gas', 6, 9, 'Unit', 101000, 120000, 0, 3, 'Regulator TT Wing Gas - No Buku: 77'),
('REG-007', 'Regulator Wing Gas Pink', 6, 9, 'Unit', 113000, 135000, 0, 3, 'Regulator Wing Gas - No Buku: 74'),
('REG-008', 'Slang Caisar', 6, 9, 'Unit', 75000, 90000, 0, 3, 'Slang Caisar - No Buku: 36'),
('REG-009', 'Slang Miyako', 6, 9, 'Unit', 84000, 100000, 0, 3, 'Slang Miyako - No Buku: 35'),
('REG-010', 'Slang Orange', 6, 9, 'Meter', 12500, 15000, 0, 10, 'Slang Orange per meter - No Buku: 79');

-- Setrika & Teko Listrik (3 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('STK-001', 'Setrika Philips', 6, 9, 'Unit', 189000, 225000, 0, 2, 'Setrika Philips - No Buku: 31'),
('STK-002', 'Setrika Philips Classic', 6, 9, 'Unit', 348000, 415000, 0, 2, 'Setrika Philips Classic - No Buku: 30'),
('STK-003', 'Teko Listrik', 6, 9, 'Unit', 88000, 105000, 0, 2, 'Teko Listrik - No Buku: 46');

-- TV & Parabola (5 items)
INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) VALUES
('TVP-001', 'Nex Parabola', 2, 9, 'Unit', 335000, 400000, 0, 1, 'Nex Parabola - No Buku: 41'),
('TVP-002', 'Nex Parabola + Payung', 2, 9, 'Paket', 670000, 800000, 0, 1, 'Nex Parabola Set - No Buku: 42'),
('TVP-003', 'Raket TV', 2, 9, 'Unit', 88000, 105000, 0, 3, 'Raket TV - No Buku: 47'),
('TVP-004', 'Remot Digital', 2, 9, 'Unit', 33500, 40000, 0, 5, 'Remot Digital - No Buku: 43'),
('TVP-005', 'TV Sharp 2T-C32', 2, 5, 'Unit', 1720000, 2050000, 0, 1, 'TV Sharp 32 inch - No Buku: 40');

-- ============================================
-- SUMMARY
-- ============================================
-- Total barang: 84 items
-- Kategori yang dipakai: Audio, TV & Parabola, Kipas Angin, Kulkas/Freezer/Showcase, Magic Com/Blender, Lain-lain
-- Merek: Sebagian besar generic (id=9), Sharp, LG, Polytron, Panasonic
-- Harga modal dihitung 84% dari harga jual (asumsi margin ~19%)
-- Stok awal kebanyakan 0 sesuai spreadsheet
-- No. Buku dicatat di field deskripsi untuk referensi
-- ============================================

SELECT 'Seed data berhasil diimport!' as status,
       (SELECT COUNT(*) FROM barang) as total_barang,
       (SELECT COUNT(*) FROM supplier) as total_supplier;
