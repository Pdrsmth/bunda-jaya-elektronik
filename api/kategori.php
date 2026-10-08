<?php
/**
 * Kategori API
 * GET    /api/kategori.php        -> Get all kategori
 * POST   /api/kategori.php        -> Create kategori (Admin/Owner only)
 * PUT    /api/kategori.php?id=1   -> Update kategori (Admin/Owner only)
 * DELETE /api/kategori.php?id=1   -> Delete kategori (Owner only, jika tidak dipakai barang)
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
// GET ALL KATEGORI
// ============================================
if ($method === 'GET') {
    try {
        $query = "SELECT * FROM kategori ORDER BY nama ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $kategoriList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($kategoriList);
    } catch (PDOException $e) {
        error_log("Get kategori error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data kategori');
    }
}

// ============================================
// CREATE KATEGORI
// ============================================
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak', 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['nama'])) {
        Response::error('Nama kategori harus diisi', 400);
    }
    
    try {
        $query = "INSERT INTO kategori (nama, deskripsi) VALUES (:nama, :deskripsi)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nama', $data['nama']);
        $deskripsi = $data['deskripsi'] ?? null;
        $stmt->bindValue(':deskripsi', $deskripsi, $deskripsi === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->execute();
        
        Response::success(['id' => $db->lastInsertId()], 'Kategori berhasil ditambahkan', 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            Response::error('Nama kategori sudah ada', 400);
        }
        error_log("Create kategori error: " . $e->getMessage());
        Response::serverError('Gagal menambahkan kategori');
    }
}

// ============================================
// UPDATE KATEGORI
// ============================================
if ($method === 'PUT') {
    Csrf::validate();
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak', 403);
    }
    if (!$id) {
        Response::error('ID kategori harus disertakan', 400);
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $nama = trim($data['nama'] ?? '');

    if ($nama === '') {
        Response::error('Nama kategori harus diisi', 400);
    }

    try {
        $query = "UPDATE kategori SET nama = :nama, deskripsi = :deskripsi WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nama', $nama);
        $deskripsi = $data['deskripsi'] ?? null;
        if ($deskripsi === '') $deskripsi = null;
        $stmt->bindValue(':deskripsi', $deskripsi, $deskripsi === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Kategori berhasil diupdate');
        } else {
            Response::notFound('Kategori tidak ditemukan');
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            Response::error('Nama kategori sudah ada', 400);
        }
        error_log("Update kategori error: " . $e->getMessage());
        Response::serverError('Gagal mengupdate kategori');
    }
}

// ============================================
// DELETE KATEGORI
// ============================================
if ($method === 'DELETE') {
    Csrf::validate();
    if ($_SESSION['role'] !== 'Owner') {
        Response::error('Akses ditolak. Hanya Owner yang dapat menghapus kategori.', 403);
    }
    if (!$id) {
        Response::error('ID kategori harus disertakan', 400);
    }

    try {
        // Cek apakah masih dipakai barang
        $checkStmt = $db->prepare("SELECT COUNT(*) as cnt FROM barang WHERE kategori_id = :id");
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        if ((int)$checkStmt->fetch(PDO::FETCH_ASSOC)['cnt'] > 0) {
            Response::error('Kategori tidak dapat dihapus karena masih dipakai barang', 400);
        }

        $stmt = $db->prepare("DELETE FROM kategori WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Kategori berhasil dihapus');
        } else {
            Response::notFound('Kategori tidak ditemukan');
        }
    } catch (PDOException $e) {
        error_log("Delete kategori error: " . $e->getMessage());
        Response::serverError('Gagal menghapus kategori');
    }
}

Response::error('Invalid method', 405);
