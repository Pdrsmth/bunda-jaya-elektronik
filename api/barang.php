<?php
/**
 * Barang API
 * GET    /api/barang.php           -> Get all barang
 * GET    /api/barang.php?id=1      -> Get single barang
 * POST   /api/barang.php           -> Create barang
 * PUT    /api/barang.php?id=1      -> Update barang
 * DELETE /api/barang.php?id=1      -> Delete barang
 */

require_once 'utils/Session.php';
startSecureSession();

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';
require_once 'utils/Csrf.php';
require_once 'utils/Validator.php';

// Check authentication
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
// GET ALL BARANG or GET BY ID
// ============================================
if ($method === 'GET') {
    try {
        if ($id) {
            // Get single barang
            $query = "SELECT b.*, k.nama as kategori_nama, m.nama as merek_nama 
                      FROM barang b
                      LEFT JOIN kategori k ON b.kategori_id = k.id
                      LEFT JOIN merek m ON b.merek_id = m.id
                      WHERE b.id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $barang = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($barang) {
                Response::success($barang);
            } else {
                Response::notFound('Barang tidak ditemukan');
            }
        } else {
            // Get all barang with kategori & merek joined
            $query = "SELECT b.*, k.nama as kategori_nama, m.nama as merek_nama 
                      FROM barang b
                      LEFT JOIN kategori k ON b.kategori_id = k.id
                      LEFT JOIN merek m ON b.merek_id = m.id
                      ORDER BY b.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $barangList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::success($barangList);
        }
    } catch (PDOException $e) {
        error_log("Get barang error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data barang');
    }
}

// ============================================
// CREATE BARANG
// ============================================
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    // Check role
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak. Hanya Admin/Owner yang dapat menambah barang.', 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    $required = ['kode', 'nama', 'kategori_id', 'merek_id', 'harga_beli', 'harga_jual', 'stok', 'stok_minimum'];
    $errors = Validator::required($data, $required);
    
    if ($errors) {
        Response::validationError($errors);
    }
    
    // Validate numeric fields
    if (!Validator::isPositive($data['harga_beli'])) {
        Response::error('Harga beli harus angka positif', 400);
    }
    if (!Validator::isPositive($data['harga_jual'])) {
        Response::error('Harga jual harus angka positif', 400);
    }
    if ($data['harga_jual'] < $data['harga_beli']) {
        Response::error('Harga jual tidak boleh lebih rendah dari harga beli', 400);
    }
    // Stok & stok minimum harus bilangan bulat >= 0 (tolak desimal)
    if (!Validator::isNonNegativeInt($data['stok'])) {
        Response::error('Stok awal harus bilangan bulat >= 0', 400);
    }
    if (!Validator::isNonNegativeInt($data['stok_minimum'])) {
        Response::error('Stok minimum harus bilangan bulat >= 0', 400);
    }
    
    try {
        // Check if kode already exists
        $checkQuery = "SELECT id FROM barang WHERE kode = :kode LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':kode', $data['kode']);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            Response::error('Kode barang sudah digunakan', 400);
        }
        
        // Insert new barang
        $query = "INSERT INTO barang (kode, nama, kategori_id, merek_id, satuan, harga_beli, harga_jual, stok, stok_minimum, deskripsi) 
                  VALUES (:kode, :nama, :kategori_id, :merek_id, :satuan, :harga_beli, :harga_jual, :stok, :stok_minimum, :deskripsi)";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(':kode', $data['kode']);
        $stmt->bindParam(':nama', $data['nama']);
        $stmt->bindParam(':kategori_id', $data['kategori_id'], PDO::PARAM_INT);
        $stmt->bindParam(':merek_id', $data['merek_id'], PDO::PARAM_INT);
        $stmt->bindParam(':satuan', $data['satuan']);
        $stmt->bindParam(':harga_beli', $data['harga_beli']);
        $stmt->bindParam(':harga_jual', $data['harga_jual']);
        $stmt->bindParam(':stok', $data['stok'], PDO::PARAM_INT);
        $stmt->bindParam(':stok_minimum', $data['stok_minimum'], PDO::PARAM_INT);
        $deskripsi = $data['deskripsi'] ?? null;
        $stmt->bindValue(':deskripsi', $deskripsi, $deskripsi === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        
        $stmt->execute();
        $newId = $db->lastInsertId();
        
        Response::success(['id' => $newId], 'Barang berhasil ditambahkan', 201);
    } catch (PDOException $e) {
        error_log("Create barang error: " . $e->getMessage());
        Response::serverError('Gagal menambahkan barang');
    }
}

// ============================================
// UPDATE BARANG
// ============================================
// ============================================
if ($method === 'PUT') {
    Csrf::validate();
    if (!$id) {
        Response::error('ID barang harus disertakan', 400);
    }
    
    // Check role
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak. Hanya Admin/Owner yang dapat mengubah barang.', 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        // Check if barang exists + ambil harga existing untuk validasi final
        $checkQuery = "SELECT id, harga_beli, harga_jual FROM barang WHERE id = :id LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            Response::notFound('Barang tidak ditemukan');
        }

        // Validate harga jual final >= harga beli final (gabung data baru + existing)
        if (isset($data['harga_jual']) || isset($data['harga_beli'])) {
            $finalJual = isset($data['harga_jual']) ? $data['harga_jual'] : $existing['harga_jual'];
            $finalBeli = isset($data['harga_beli']) ? $data['harga_beli'] : $existing['harga_beli'];
            if ($finalJual < $finalBeli) {
                Response::error('Harga jual tidak boleh lebih rendah dari harga beli', 400);
            }
        }
        
        // Build dynamic update query
        $updateFields = [];
        $allowedFields = ['nama', 'kategori_id', 'merek_id', 'satuan', 'harga_beli', 'harga_jual', 'stok_minimum', 'deskripsi'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
            }
        }
        
        // Validasi nilai yang diupdate
        if (isset($data['stok_minimum']) && !Validator::isNonNegativeInt($data['stok_minimum'])) {
            Response::error('Stok minimum harus bilangan bulat >= 0', 400);
        }
        if (isset($data['harga_beli']) && !Validator::isPositive($data['harga_beli'])) {
            Response::error('Harga beli harus angka positif', 400);
        }
        if (isset($data['harga_jual']) && !Validator::isPositive($data['harga_jual'])) {
            Response::error('Harga jual harus angka positif', 400);
        }
        
        if (empty($updateFields)) {
            Response::error('Tidak ada data yang diubah', 400);
        }
        
        $query = "UPDATE barang SET " . implode(', ', $updateFields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $stmt->bindParam(":$field", $data[$field]);
            }
        }
        
        $stmt->execute();
        
        Response::success(null, 'Barang berhasil diupdate');
    } catch (PDOException $e) {
        error_log("Update barang error: " . $e->getMessage());
        Response::serverError('Gagal mengupdate barang');
    }
}

// ============================================
// DELETE BARANG
// ============================================
// ============================================
if ($method === 'DELETE') {
    Csrf::validate();
    if (!$id) {
        Response::error('ID barang harus disertakan', 400);
    }
    
    // Check role
    if ($_SESSION['role'] !== 'Owner') {
        Response::error('Akses ditolak. Hanya Owner yang dapat menghapus barang.', 403);
    }
    
    try {
        // Check if barang has transactions
        $checkTxQuery = "SELECT COUNT(*) as count FROM transaksi_detail WHERE barang_id = :id";
        $checkTxStmt = $db->prepare($checkTxQuery);
        $checkTxStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkTxStmt->execute();
        $txCount = $checkTxStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($txCount > 0) {
            Response::error('Barang tidak dapat dihapus karena sudah ada transaksi terkait', 400);
        }
        
        // Delete barang
        $query = "DELETE FROM barang WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Barang berhasil dihapus');
        } else {
            Response::notFound('Barang tidak ditemukan');
        }
    } catch (PDOException $e) {
        error_log("Delete barang error: " . $e->getMessage());
        Response::serverError('Gagal menghapus barang');
    }
}

Response::error('Invalid method', 405);
