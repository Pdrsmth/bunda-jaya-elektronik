<?php
/**
 * Hutang Supplier API
 * GET  /api/hutang.php               -> Get all active hutang
 * GET  /api/hutang.php?id=1          -> Get single hutang detail
 * POST /api/hutang.php?action=bayar  -> Pay hutang (cicilan atau lunas)
 */

require_once 'utils/Session.php';
startSecureSession();

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';
require_once 'utils/Csrf.php';
require_once 'utils/Validator.php';

if (!isset($_SESSION['user_id'])) {
    Response::unauthorized('Silakan login terlebih dahulu');
}

// Check role
if ($_SESSION['role'] === 'Kasir') {
    Response::error('Akses ditolak. Hanya Admin/Owner yang dapat mengakses hutang.', 403);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError('Database connection failed');
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

// ============================================
// GET ALL ACTIVE HUTANG
// ============================================
if ($method === 'GET' && !$id && $action !== 'history') {
    try {
        $query = "SELECT h.*, s.nama as supplier_nama, p.nomor as pembelian_nomor, p.tanggal as pembelian_tanggal
                  FROM hutang_supplier h
                  LEFT JOIN supplier s ON h.supplier_id = s.id
                  LEFT JOIN pembelian p ON h.pembelian_id = p.id
                  WHERE h.status = 'Belum Lunas'
                  ORDER BY h.jatuh_tempo ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $hutangList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add status tempo (overdue, due today, etc)
        $today = date('Y-m-d');
        foreach ($hutangList as &$hutang) {
            if ($hutang['jatuh_tempo'] < $today) {
                $hutang['status_tempo'] = 'Terlambat';
            } elseif ($hutang['jatuh_tempo'] === $today) {
                $hutang['status_tempo'] = 'Jatuh Tempo Hari Ini';
            } elseif ($hutang['jatuh_tempo'] <= date('Y-m-d', strtotime('+3 days'))) {
                $hutang['status_tempo'] = 'Segera Jatuh Tempo';
            } else {
                $hutang['status_tempo'] = 'Belum Jatuh Tempo';
            }
        }
        
        Response::success($hutangList);
    } catch (PDOException $e) {
        error_log("Get hutang error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data hutang');
    }
}

// ============================================
// GET SINGLE HUTANG DETAIL
// ============================================
if ($method === 'GET' && $id) {
    try {
        $query = "SELECT h.*, s.nama as supplier_nama, s.kontak as supplier_kontak, 
                  p.nomor as pembelian_nomor, p.tanggal as pembelian_tanggal
                  FROM hutang_supplier h
                  LEFT JOIN supplier s ON h.supplier_id = s.id
                  LEFT JOIN pembelian p ON h.pembelian_id = p.id
                  WHERE h.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $hutang = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$hutang) {
            Response::notFound('Hutang tidak ditemukan');
        }
        
        // Get payment history
        $historyQuery = "SELECT ph.*, u.nama as user_nama
                         FROM pembayaran_hutang ph
                         LEFT JOIN users u ON ph.user_id = u.id
                         WHERE ph.hutang_id = :hutang_id
                         ORDER BY ph.tanggal_bayar DESC";
        $historyStmt = $db->prepare($historyQuery);
        $historyStmt->bindParam(':hutang_id', $id, PDO::PARAM_INT);
        $historyStmt->execute();
        
        $hutang['payment_history'] = $historyStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($hutang);
    } catch (PDOException $e) {
        error_log("Get hutang detail error: " . $e->getMessage());
        Response::serverError('Gagal mengambil detail hutang');
    }
}

// ============================================
// PAY HUTANG (Cicilan atau Lunas)
// ============================================
if ($method === 'POST' && $action === 'bayar') {
    Csrf::validate();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    $required = ['hutang_id', 'jumlah_bayar', 'metode_bayar'];
    $errors = Validator::required($data, $required);
    
    if ($errors) {
        Response::validationError($errors);
    }
    
    $hutangId = $data['hutang_id'];
    $jumlahBayar = $data['jumlah_bayar'];
    $metodeBayar = $data['metode_bayar'];
    if (!in_array($metodeBayar, ['Tunai', 'Transfer', 'QRIS'], true)) {
        Response::error('Metode pembayaran tidak valid', 400);
    }
    $tanggalBayar = $data['tanggal_bayar'] ?? date('Y-m-d');
    if ($tanggalBayar === '') {
        $tanggalBayar = date('Y-m-d');
    }
    // BUG-08: tanggal pembayaran harus valid dan tidak boleh masa depan
    if (!Validator::isValidDate($tanggalBayar)) {
        Response::error('Format tanggal pembayaran tidak valid (gunakan YYYY-MM-DD)', 400);
    }
    if ($tanggalBayar > date('Y-m-d')) {
        Response::error('Tanggal pembayaran tidak boleh melebihi hari ini', 400);
    }
    
    if (!Validator::isPositive($jumlahBayar) || $jumlahBayar <= 0) {
        Response::error('Jumlah bayar harus lebih dari 0', 400);
    }
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // Get hutang data
        $hutangQuery = "SELECT * FROM hutang_supplier WHERE id = :id FOR UPDATE";
        $hutangStmt = $db->prepare($hutangQuery);
        $hutangStmt->bindParam(':id', $hutangId, PDO::PARAM_INT);
        $hutangStmt->execute();
        
        $hutang = $hutangStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$hutang) {
            $db->rollBack();
            Response::notFound('Hutang tidak ditemukan');
        }
        
        if ($hutang['status'] === 'Lunas') {
            $db->rollBack();
            Response::error('Hutang sudah lunas', 400);
        }
        
        if ($jumlahBayar > $hutang['sisa_hutang']) {
            $db->rollBack();
            Response::error("Jumlah bayar melebihi sisa hutang (Rp " . number_format($hutang['sisa_hutang'], 0, ',', '.') . ")", 400);
        }
        
        // Insert payment record
        $insertPaymentQuery = "INSERT INTO pembayaran_hutang 
                               (hutang_id, tanggal_bayar, jumlah_bayar, metode_bayar, user_id) 
                               VALUES 
                               (:hutang_id, :tanggal_bayar, :jumlah_bayar, :metode_bayar, :user_id)";
        $paymentStmt = $db->prepare($insertPaymentQuery);
        
        $paymentStmt->bindParam(':hutang_id', $hutangId, PDO::PARAM_INT);
        $paymentStmt->bindParam(':tanggal_bayar', $tanggalBayar);
        $paymentStmt->bindParam(':jumlah_bayar', $jumlahBayar);
        $paymentStmt->bindParam(':metode_bayar', $metodeBayar);
        $paymentStmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
        
        $paymentStmt->execute();
        
        // Update hutang manual di sini (pengganti trigger trg_after_pembayaran_hutang_insert).
        // Trigger dihapus dari schema agar app jalan di hosting tanpa hak TRIGGER.
        // Dihitung eksplisit di PHP dari baris yang sudah di-FOR UPDATE (anti race, tanpa
        // ambiguitas urutan evaluasi assignment MySQL).
        $newSudahBayar = (float)$hutang['sudah_dibayar'] + (float)$jumlahBayar;
        $newSisaHutang = (float)$hutang['total_hutang'] - $newSudahBayar;
        $newStatusHitung = $newSisaHutang <= 0 ? 'Lunas' : 'Belum Lunas';
        $updHutangStmt = $db->prepare("UPDATE hutang_supplier
                                       SET sudah_dibayar = :sudah,
                                           sisa_hutang = :sisa,
                                           status = :status
                                       WHERE id = :hutang_id");
        $updHutangStmt->bindParam(':sudah', $newSudahBayar);
        $updHutangStmt->bindParam(':sisa', $newSisaHutang);
        $updHutangStmt->bindParam(':status', $newStatusHitung);
        $updHutangStmt->bindParam(':hutang_id', $hutangId, PDO::PARAM_INT);
        $updHutangStmt->execute();
        
        // Ambil nilai terbaru untuk response:
        $refreshStmt = $db->prepare("SELECT sudah_dibayar, sisa_hutang, status FROM hutang_supplier WHERE id = :id");
        $refreshStmt->bindParam(':id', $hutangId, PDO::PARAM_INT);
        $refreshStmt->execute();
        $updated = $refreshStmt->fetch(PDO::FETCH_ASSOC);
        $newSudahBayar = $updated['sudah_dibayar'];
        $newSisaHutang = $updated['sisa_hutang'];
        $newStatus = $updated['status'];
        
        // Commit transaction
        $db->commit();
        
        Response::success([
            'hutang_id' => $hutangId,
            'sudah_dibayar' => $newSudahBayar,
            'sisa_hutang' => $newSisaHutang,
            'status' => $newStatus
        ], 'Pembayaran hutang berhasil disimpan');
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Pay hutang error: " . $e->getMessage());
        Response::serverError('Gagal menyimpan pembayaran hutang. Silakan coba lagi.');
    }
}

Response::error('Invalid method or action', 405);
