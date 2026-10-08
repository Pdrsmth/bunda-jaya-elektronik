<?php
/**
 * Dashboard & Laporan API
 * GET /api/dashboard.php?action=metrics           -> Dashboard metrics
 * GET /api/dashboard.php?action=penjualan-harian  -> Laporan penjualan harian
 * GET /api/dashboard.php?action=terlaris          -> Laporan barang terlaris
 * GET /api/dashboard.php?action=stok-menipis      -> Laporan stok menipis
 * GET /api/dashboard.php?action=kas-harian        -> Laporan kas harian
 * GET /api/dashboard.php?action=chart-7hari       -> Chart data 7 hari terakhir
 */

require_once 'utils/Session.php';
startSecureSession();

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';

if (!isset($_SESSION['user_id'])) {
    Response::unauthorized('Silakan login terlebih dahulu');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError('Database connection failed');
}

$action = $_GET['action'] ?? '';

// Laporan finansial hanya untuk Owner (menu UI disembunyikan untuk Admin,
// tapi enforcement harus di backend)
$ownerOnlyActions = ['penjualan-harian', 'terlaris', 'stok-menipis', 'kas-harian'];
if (in_array($action, $ownerOnlyActions, true) && ($_SESSION['role'] ?? '') !== 'Owner') {
    Response::error('Akses ditolak. Laporan hanya untuk Owner.', 403);
}

// ============================================
// DASHBOARD METRICS
// ============================================
if ($action === 'metrics') {
    try {
        $today = date('Y-m-d');
        
        // Total transaksi hari ini
        $txQuery = "SELECT COUNT(*) as total_transaksi, COALESCE(SUM(total), 0) as total_omzet
                    FROM transaksi 
                    WHERE DATE(tanggal) = :today";
        $txStmt = $db->prepare($txQuery);
        $txStmt->bindParam(':today', $today);
        $txStmt->execute();
        $txData = $txStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate laba kotor hari ini = pendapatan (setelah diskon) - HPP
        $labaQuery = "SELECT 
                        COALESCE((SELECT SUM(total) FROM transaksi WHERE DATE(tanggal) = :today), 0)
                        - COALESCE(SUM(td.jumlah * td.harga_beli), 0) as laba_kotor
                      FROM transaksi_detail td
                      JOIN transaksi t ON td.transaksi_id = t.id
                      WHERE DATE(t.tanggal) = :today";
        $labaStmt = $db->prepare($labaQuery);
        $labaStmt->bindParam(':today', $today);
        $labaStmt->execute();
        $labaData = $labaStmt->fetch(PDO::FETCH_ASSOC);
        
        // Stok menipis count
        $stokQuery = "SELECT COUNT(*) as count FROM barang WHERE stok <= stok_minimum";
        $stokStmt = $db->prepare($stokQuery);
        $stokStmt->execute();
        $stokData = $stokStmt->fetch(PDO::FETCH_ASSOC);
        
        // Top 5 products
        $topQuery = "SELECT 
                        b.nama,
                        SUM(td.jumlah) as total_qty,
                        SUM(td.subtotal) as total_revenue
                     FROM transaksi_detail td
                     JOIN barang b ON td.barang_id = b.id
                     GROUP BY b.id, b.nama
                     ORDER BY total_qty DESC
                     LIMIT 5";
        $topStmt = $db->prepare($topQuery);
        $topStmt->execute();
        $topProducts = $topStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Barang stok menipis (limit 5 untuk dashboard)
        $lowStockQuery = "SELECT id, kode, nama, stok, stok_minimum, satuan 
                          FROM barang 
                          WHERE stok <= stok_minimum 
                          ORDER BY stok ASC 
                          LIMIT 5";
        $lowStockStmt = $db->prepare($lowStockQuery);
        $lowStockStmt->execute();
        $lowStockItems = $lowStockStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Active debts
        $debtQuery = "SELECT h.*, s.nama as supplier_nama
                      FROM hutang_supplier h
                      LEFT JOIN supplier s ON h.supplier_id = s.id
                      WHERE h.status = 'Belum Lunas'
                      AND h.jatuh_tempo <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                      ORDER BY h.jatuh_tempo ASC
                      LIMIT 5";
        $debtStmt = $db->prepare($debtQuery);
        $debtStmt->execute();
        $activeDebts = $debtStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Piutang aktif (bungkus try sendiri: tabel mungkin belum dimigrasi)
        $piutangAktif = ['count' => 0, 'total_sisa' => 0];
        try {
            $piutangStmt = $db->prepare("SELECT COUNT(*) as count, COALESCE(SUM(sisa_piutang), 0) as total_sisa
                                         FROM piutang_pelanggan WHERE status = 'Belum Lunas'");
            $piutangStmt->execute();
            $piutangAktif = $piutangStmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Piutang metrics skipped (tabel belum ada?): " . $e->getMessage());
        }
        
        Response::success([
            'total_transaksi' => (int)$txData['total_transaksi'],
            'total_omzet' => (float)$txData['total_omzet'],
            'laba_kotor' => (float)$labaData['laba_kotor'],
            'stok_menipis_count' => (int)$stokData['count'],
            'top_products' => $topProducts,
            'low_stock_items' => $lowStockItems,
            'active_debts' => $activeDebts,
            'piutang_aktif_count' => (int)$piutangAktif['count'],
            'piutang_aktif_total' => (float)$piutangAktif['total_sisa']
        ]);
    } catch (PDOException $e) {
        error_log("Dashboard metrics error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data dashboard');
    }
}

// ============================================
// CHART DATA 7 HARI TERAKHIR
// ============================================
if ($action === 'chart-7hari') {
    try {
        $chartData = [];
        
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            
            $query = "SELECT 
                        COUNT(*) as count,
                        COALESCE(SUM(total), 0) as omzet
                      FROM transaksi
                      WHERE DATE(tanggal) = :date";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':date', $date);
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $chartData[] = [
                'date' => $date,
                'label' => date('D, j M', strtotime($date)),
                'count' => (int)$data['count'],
                'omzet' => (float)$data['omzet']
            ];
        }
        
        Response::success($chartData);
    } catch (PDOException $e) {
        error_log("Chart data error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data chart');
    }
}

// ============================================
// LAPORAN PENJUALAN HARIAN
// ============================================
if ($action === 'penjualan-harian') {
    try {
        $tanggal = $_GET['tanggal'] ?? date('Y-m-d');
        
        // Summary metrics
        $summaryQuery = "SELECT 
                            COUNT(*) as total_transaksi,
                            COALESCE(SUM(total), 0) as total_pendapatan,
                            COALESCE(SUM(CASE WHEN metode_bayar = 'Tunai' THEN total ELSE 0 END), 0) as tunai,
                            COUNT(CASE WHEN metode_bayar = 'Tunai' THEN 1 END) as tunai_count,
                            COALESCE(SUM(CASE WHEN metode_bayar = 'Transfer' THEN total ELSE 0 END), 0) as transfer,
                            COUNT(CASE WHEN metode_bayar = 'Transfer' THEN 1 END) as transfer_count,
                            COALESCE(SUM(CASE WHEN metode_bayar = 'QRIS' THEN total ELSE 0 END), 0) as qris,
                            COUNT(CASE WHEN metode_bayar = 'QRIS' THEN 1 END) as qris_count,
                            COALESCE(SUM(CASE WHEN metode_bayar = 'Kredit' THEN total ELSE 0 END), 0) as kredit,
                            COUNT(CASE WHEN metode_bayar = 'Kredit' THEN 1 END) as kredit_count
                         FROM transaksi
                         WHERE DATE(tanggal) = :tanggal";
        $summaryStmt = $db->prepare($summaryQuery);
        $summaryStmt->bindParam(':tanggal', $tanggal);
        $summaryStmt->execute();
        $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate HPP and laba (laba = pendapatan setelah diskon - HPP)
        $labaQuery = "SELECT 
                        COALESCE(SUM(td.jumlah * td.harga_beli), 0) as total_hpp,
                        COALESCE((SELECT SUM(total) FROM transaksi WHERE DATE(tanggal) = :tanggal), 0)
                        - COALESCE(SUM(td.jumlah * td.harga_beli), 0) as laba_kotor
                      FROM transaksi_detail td
                      JOIN transaksi t ON td.transaksi_id = t.id
                      WHERE DATE(t.tanggal) = :tanggal";
        $labaStmt = $db->prepare($labaQuery);
        $labaStmt->bindParam(':tanggal', $tanggal);
        $labaStmt->execute();
        $labaData = $labaStmt->fetch(PDO::FETCH_ASSOC);
        
        // Detail transactions
        $detailQuery = "SELECT t.*, u.nama as kasir_nama
                        FROM transaksi t
                        LEFT JOIN users u ON t.kasir_id = u.id
                        WHERE DATE(t.tanggal) = :tanggal
                        ORDER BY t.tanggal DESC";
        $detailStmt = $db->prepare($detailQuery);
        $detailStmt->bindParam(':tanggal', $tanggal);
        $detailStmt->execute();
        $transactions = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success([
            'tanggal' => $tanggal,
            'summary' => array_merge($summary, $labaData),
            'transactions' => $transactions
        ]);
    } catch (PDOException $e) {
        error_log("Laporan penjualan error: " . $e->getMessage());
        Response::serverError('Gagal mengambil laporan penjualan');
    }
}

// ============================================
// LAPORAN BARANG TERLARIS
// ============================================
if ($action === 'terlaris') {
    try {
        $dateFrom = $_GET['date_from'] ?? date('Y-m-01'); // First day of current month
        $dateTo = $_GET['date_to'] ?? date('Y-m-d');

        // Sort whitelist: quantity | revenue | profit
        $sort = $_GET['sort'] ?? 'quantity';
        $allowedSort = [
            'quantity' => 'total_terjual DESC',
            'revenue'  => 'total_revenue DESC',
            'profit'   => 'total_laba DESC',
        ];
        $orderBy = $allowedSort[$sort] ?? $allowedSort['quantity'];
        
        $query = "SELECT 
                    b.id,
                    b.kode,
                    b.nama,
                    k.nama as kategori,
                    m.nama as merek,
                    SUM(td.jumlah) as total_terjual,
                    SUM(td.subtotal) as total_revenue,
                    SUM(td.subtotal - (td.subtotal * t.diskon_amount / NULLIF(t.subtotal, 0)) - td.jumlah * td.harga_beli) as total_laba
                  FROM transaksi_detail td
                  JOIN barang b ON td.barang_id = b.id
                  LEFT JOIN kategori k ON b.kategori_id = k.id
                  LEFT JOIN merek m ON b.merek_id = m.id
                  JOIN transaksi t ON td.transaksi_id = t.id
                  WHERE DATE(t.tanggal) BETWEEN :date_from AND :date_to
                  GROUP BY b.id, b.kode, b.nama, k.nama, m.nama
                  ORDER BY $orderBy
                  LIMIT 50";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':date_from', $dateFrom);
        $stmt->bindParam(':date_to', $dateTo);
        $stmt->execute();
        
        $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success([
            'period' => ['from' => $dateFrom, 'to' => $dateTo],
            'products' => $topProducts
        ]);
    } catch (PDOException $e) {
        error_log("Laporan terlaris error: " . $e->getMessage());
        Response::serverError('Gagal mengambil laporan barang terlaris');
    }
}

// ============================================
// LAPORAN STOK MENIPIS
// ============================================
if ($action === 'stok-menipis') {
    try {
        $query = "SELECT b.*, k.nama as kategori, m.nama as merek
                  FROM barang b
                  LEFT JOIN kategori k ON b.kategori_id = k.id
                  LEFT JOIN merek m ON b.merek_id = m.id
                  WHERE b.stok <= b.stok_minimum
                  ORDER BY b.stok ASC, b.stok_minimum DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $lowStockItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($lowStockItems);
    } catch (PDOException $e) {
        error_log("Laporan stok menipis error: " . $e->getMessage());
        Response::serverError('Gagal mengambil laporan stok menipis');
    }
}

// ============================================
// LAPORAN KAS HARIAN
// ============================================
if ($action === 'kas-harian') {
    try {
        $tanggal = $_GET['tanggal'] ?? date('Y-m-d');
        
        // Kas masuk (penjualan tunai)
        $kasMasukQuery = "SELECT COALESCE(SUM(total), 0) as kas_masuk
                          FROM transaksi
                          WHERE DATE(tanggal) = :tanggal AND metode_bayar = 'Tunai'";
        $kasMasukStmt = $db->prepare($kasMasukQuery);
        $kasMasukStmt->bindParam(':tanggal', $tanggal);
        $kasMasukStmt->execute();
        $kasMasuk = $kasMasukStmt->fetch(PDO::FETCH_ASSOC)['kas_masuk'];
        
        // Kas masuk dari cicilan/DP piutang tunai (skip aman jika tabel belum dimigrasi)
        try {
            $kasMasukPiutangQuery = "SELECT COALESCE(SUM(jumlah_bayar), 0) as kas_masuk_piutang
                                    FROM pembayaran_piutang
                                    WHERE tanggal_bayar = :tanggal AND metode_bayar = 'Tunai'";
            $kasMasukPiutangStmt = $db->prepare($kasMasukPiutangQuery);
            $kasMasukPiutangStmt->bindParam(':tanggal', $tanggal);
            $kasMasukPiutangStmt->execute();
            $kasMasuk += (float)$kasMasukPiutangStmt->fetch(PDO::FETCH_ASSOC)['kas_masuk_piutang'];
        } catch (PDOException $e) {
            error_log("Kas piutang skipped (tabel belum ada?): " . $e->getMessage());
        }
        
        // Kas keluar (pembelian tunai + pembayaran hutang tunai)
        $kasKeluarQuery = "SELECT COALESCE(SUM(total), 0) as kas_keluar_pembelian
                           FROM pembelian
                           WHERE tanggal = :tanggal 
                           AND status_bayar = 'Lunas' 
                           AND metode_bayar = 'Tunai'";
        $kasKeluarStmt = $db->prepare($kasKeluarQuery);
        $kasKeluarStmt->bindParam(':tanggal', $tanggal);
        $kasKeluarStmt->execute();
        $kasKeluarPembelian = $kasKeluarStmt->fetch(PDO::FETCH_ASSOC)['kas_keluar_pembelian'];
        
        $kasKeluarHutangQuery = "SELECT COALESCE(SUM(jumlah_bayar), 0) as kas_keluar_hutang
                                 FROM pembayaran_hutang
                                 WHERE tanggal_bayar = :tanggal 
                                 AND metode_bayar = 'Tunai'";
        $kasKeluarHutangStmt = $db->prepare($kasKeluarHutangQuery);
        $kasKeluarHutangStmt->bindParam(':tanggal', $tanggal);
        $kasKeluarHutangStmt->execute();
        $kasKeluarHutang = $kasKeluarHutangStmt->fetch(PDO::FETCH_ASSOC)['kas_keluar_hutang'];
        
        $totalKasKeluar = $kasKeluarPembelian + $kasKeluarHutang;
        
        // Tanpa saldo awal fiktif: kas murni arus kas hari itu (masuk - keluar).
        // Tabel `kas` tidak lagi dipakai sebagai acuan saldo.
        $selisih = $kasMasuk - $totalKasKeluar;
        
        // Detail transactions
        $detailMasukQuery = "SELECT nomor, tanggal, total, metode_bayar 
                             FROM transaksi 
                             WHERE DATE(tanggal) = :tanggal AND metode_bayar = 'Tunai'
                             ORDER BY tanggal DESC";
        $detailMasukStmt = $db->prepare($detailMasukQuery);
        $detailMasukStmt->bindParam(':tanggal', $tanggal);
        $detailMasukStmt->execute();
        $detailKasMasuk = $detailMasukStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success([
            'tanggal' => $tanggal,
            'kas_masuk' => (float)$kasMasuk,
            'kas_keluar' => (float)$totalKasKeluar,
            'selisih' => (float)$selisih,
            'detail_kas_masuk' => $detailKasMasuk
        ]);
    } catch (PDOException $e) {
        error_log("Laporan kas error: " . $e->getMessage());
        Response::serverError('Gagal mengambil laporan kas');
    }
}

Response::error('Invalid action', 400);
