<?php
/**
 * Merek API
 * GET    /api/merek.php        -> Get all merek
 * POST   /api/merek.php        -> Create merek (Admin/Owner only)
 * PUT    /api/merek.php?id=1   -> Update merek (Admin/Owner only)
 * DELETE /api/merek.php?id=1   -> Delete merek (Owner only, jika tidak dipakai barang)
 */

require_once 'utils/Session.php';
startSecureSession();

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';
require_once 'utils/Csrf.php';

if (!isset($_SESSION['user_id'])) {
    Response::unauthorized('Silakan login terlebih dahulu');
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError('Database connection failed');
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// ============================================
// GET ALL MEREK
// ============================================
if ($method === 'GET') {
    try {
        $query = "SELECT * FROM merek ORDER BY nama ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $merekList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($merekList);
    } catch (PDOException $e) {
        error_log("Get merek error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data merek');
    }
}

// ============================================
// CREATE MEREK
// ============================================
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak', 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['nama'])) {
        Response::error('Nama merek harus diisi', 400);
    }
    
    try {
        $query = "INSERT INTO merek (nama) VALUES (:nama)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nama', $data['nama']);
        $stmt->execute();
        
        Response::success(['id' => $db->lastInsertId()], 'Merek berhasil ditambahkan', 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            Response::error('Nama merek sudah ada', 400);
        }
        error_log("Create merek error: " . $e->getMessage());
        Response::serverError('Gagal menambahkan merek');
    }
}

// ============================================
// UPDATE MEREK
// ============================================
if ($method === 'PUT') {
    Csrf::validate();
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak', 403);
    }
    if (!$id) {
        Response::error('ID merek harus disertakan', 400);
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $nama = trim($data['nama'] ?? '');

    if ($nama === '') {
        Response::error('Nama merek harus diisi', 400);
    }

    try {
        $stmt = $db->prepare("UPDATE merek SET nama = :nama WHERE id = :id");
        $stmt->bindParam(':nama', $nama);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Merek berhasil diupdate');
        } else {
            Response::notFound('Merek tidak ditemukan');
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            Response::error('Nama merek sudah ada', 400);
        }
        error_log("Update merek error: " . $e->getMessage());
        Response::serverError('Gagal mengupdate merek');
    }
}

// ============================================
// DELETE MEREK
// ============================================
if ($method === 'DELETE') {
    Csrf::validate();
    if ($_SESSION['role'] !== 'Owner') {
        Response::error('Akses ditolak. Hanya Owner yang dapat menghapus merek.', 403);
    }
    if (!$id) {
        Response::error('ID merek harus disertakan', 400);
    }

    try {
        // Cek apakah masih dipakai barang
        $checkStmt = $db->prepare("SELECT COUNT(*) as cnt FROM barang WHERE merek_id = :id");
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        if ((int)$checkStmt->fetch(PDO::FETCH_ASSOC)['cnt'] > 0) {
            Response::error('Merek tidak dapat dihapus karena masih dipakai barang', 400);
        }

        $stmt = $db->prepare("DELETE FROM merek WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Merek berhasil dihapus');
        } else {
            Response::notFound('Merek tidak ditemukan');
        }
    } catch (PDOException $e) {
        error_log("Delete merek error: " . $e->getMessage());
        Response::serverError('Gagal menghapus merek');
    }
}

Response::error('Invalid method', 405);
