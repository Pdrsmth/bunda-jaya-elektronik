<?php
/**
 * Piutang Pelanggan API (Kredit Fleksibel)
 * GET  /api/piutang.php               -> Get all piutang (aktif + lunas)
 * GET  /api/piutang.php?id=1          -> Get single piutang + riwayat pembayaran
 * POST /api/piutang.php?action=bayar  -> Catat pembayaran (bebas: kapan pun, berapa pun <= sisa)
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
    Response::error('Akses ditolak. Hanya Admin/Owner yang dapat mengakses piutang.', 403);
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
// GET ALL PIUTANG
// ============================================
if ($method === 'GET' && !$id) {
    try {
        $query = "SELECT p.*, t.nomor as transaksi_nomor, t.tanggal as transaksi_tanggal, t.total as transaksi_total
                  FROM piutang_pelanggan p
                  LEFT JOIN transaksi t ON p.transaksi_id = t.id
                  ORDER BY p.status ASC, p.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $piutangList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($piutangList);
    } catch (PDOException $e) {
        error_log("Get piutang error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data piutang');
    }
}

// ============================================
// GET SINGLE PIUTANG + RIWAYAT PEMBAYARAN
// ============================================
if ($method === 'GET' && $id) {
    try {
        $query = "SELECT p.*, t.nomor as transaksi_nomor, t.tanggal as transaksi_tanggal, t.total as transaksi_total
                  FROM piutang_pelanggan p
                  LEFT JOIN transaksi t ON p.transaksi_id = t.id
                  WHERE p.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $piutang = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$piutang) {
            Response::notFound('Piutang tidak ditemukan');
        }
        
        $histQuery = "SELECT pb.*, u.nama as user_nama
                      FROM pembayaran_piutang pb
                      LEFT JOIN users u ON pb.user_id = u.id
                      WHERE pb.piutang_id = :piutang_id
                      ORDER BY pb.tanggal_bayar DESC, pb.id DESC";
        $histStmt = $db->prepare($histQuery);
        $histStmt->bindParam(':piutang_id', $id, PDO::PARAM_INT);
        $histStmt->execute();
        
        $piutang['riwayat_bayar'] = $histStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($piutang);
    } catch (PDOException $e) {
        error_log("Get piutang detail error: " . $e->getMessage());
        Response::serverError('Gagal mengambil detail piutang');
    }
}

// ============================================
// CATAT PEMBAYARAN (cicilan bebas)
// ============================================
if ($method === 'POST' && $action === 'bayar') {
    Csrf::validate();
    $data = json_decode(file_get_contents("php://input"), true);
    
    $required = ['piutang_id', 'jumlah_bayar', 'metode_bayar'];
    $errors = Validator::required($data, $required);
    
    if ($errors) {
        Response::validationError($errors);
    }
    
    $piutangId = $data['piutang_id'];
    $jumlahBayar = (float)$data['jumlah_bayar'];
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
        $db->beginTransaction();
        
        $piutangQuery = "SELECT * FROM piutang_pelanggan WHERE id = :id FOR UPDATE";
        $piutangStmt = $db->prepare($piutangQuery);
        $piutangStmt->bindParam(':id', $piutangId, PDO::PARAM_INT);
        $piutangStmt->execute();
        
        $piutang = $piutangStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$piutang) {
            $db->rollBack();
            Response::notFound('Piutang tidak ditemukan');
        }
        
        if ($jumlahBayar > $piutang['sisa_piutang']) {
            $db->rollBack();
            Response::error("Jumlah bayar melebihi sisa piutang (Rp " . number_format($piutang['sisa_piutang'], 0, ',', '.') . ")", 400);
        }
        
        // Insert pembayaran
        $insertQuery = "INSERT INTO pembayaran_piutang 
                        (piutang_id, tanggal_bayar, jumlah_bayar, metode_bayar, user_id) 
                        VALUES 
                        (:piutang_id, :tanggal_bayar, :jumlah_bayar, :metode_bayar, :user_id)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':piutang_id', $piutangId, PDO::PARAM_INT);
        $insertStmt->bindParam(':tanggal_bayar', $tanggalBayar);
        $insertStmt->bindParam(':jumlah_bayar', $jumlahBayar);
        $insertStmt->bindParam(':metode_bayar', $metodeBayar);
        $insertStmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
        $insertStmt->execute();
        
        // Update piutang
        $newSudahBayar = $piutang['sudah_dibayar'] + $jumlahBayar;
        $newSisa = $piutang['total_piutang'] - $newSudahBayar;
        $newStatus = $newSisa <= 0 ? 'Lunas' : 'Belum Lunas';
        
        $updateQuery = "UPDATE piutang_pelanggan 
                        SET sudah_dibayar = :sudah_dibayar, sisa_piutang = :sisa_piutang, status = :status 
                        WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':sudah_dibayar', $newSudahBayar);
        $updateStmt->bindParam(':sisa_piutang', $newSisa);
        $updateStmt->bindParam(':status', $newStatus);
        $updateStmt->bindParam(':id', $piutangId, PDO::PARAM_INT);
        $updateStmt->execute();
        
        $db->commit();
        
        Response::success([
            'piutang_id' => $piutangId,
            'sudah_dibayar' => $newSudahBayar,
            'sisa_piutang' => $newSisa,
            'status' => $newStatus
        ], 'Pembayaran piutang berhasil disimpan');
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Pay piutang error: " . $e->getMessage());
        Response::serverError('Gagal menyimpan pembayaran piutang. Silakan coba lagi.');
    }
}

Response::error('Invalid method or action', 405);
