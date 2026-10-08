<?php
/**
 * Supplier API
 * GET    /api/supplier.php           -> Get all supplier
 * GET    /api/supplier.php?id=1      -> Get single supplier
 * POST   /api/supplier.php           -> Create supplier
 * PUT    /api/supplier.php?id=1      -> Update supplier
 * DELETE /api/supplier.php?id=1      -> Delete supplier
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
// GET ALL SUPPLIER or GET BY ID
// ============================================
if ($method === 'GET') {
    try {
        if ($id) {
            $query = "SELECT * FROM supplier WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($supplier) {
                Response::success($supplier);
            } else {
                Response::notFound('Supplier tidak ditemukan');
            }
        } else {
            $query = "SELECT * FROM supplier ORDER BY nama ASC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $supplierList = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::success($supplierList);
        }
    } catch (PDOException $e) {
        error_log("Get supplier error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data supplier');
    }
}

// ============================================
// CREATE SUPPLIER
// ============================================
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak', 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['nama'])) {
        Response::error('Nama supplier harus diisi', 400);
    }
    
    try {
        $query = "INSERT INTO supplier (nama, kontak, alamat) VALUES (:nama, :kontak, :alamat)";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(':nama', $data['nama']);
        $kontak = $data['kontak'] ?? null;
        $stmt->bindValue(':kontak', $kontak, $kontak === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $alamat = $data['alamat'] ?? null;
        $stmt->bindValue(':alamat', $alamat, $alamat === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        
        $stmt->execute();
        
        Response::success(['id' => $db->lastInsertId()], 'Supplier berhasil ditambahkan', 201);
    } catch (PDOException $e) {
        error_log("Create supplier error: " . $e->getMessage());
        Response::serverError('Gagal menambahkan supplier');
    }
}

// ============================================
// UPDATE SUPPLIER
// ============================================
// ============================================
if ($method === 'PUT') {
    Csrf::validate();
    if (!$id) {
        Response::error('ID supplier harus disertakan', 400);
    }
    
    if ($_SESSION['role'] === 'Kasir') {
        Response::error('Akses ditolak', 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $query = "UPDATE supplier SET nama = :nama, kontak = :kontak, alamat = :alamat WHERE id = :id";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':nama', $data['nama']);
        $kontak = $data['kontak'] ?? null;
        $stmt->bindValue(':kontak', $kontak, $kontak === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $alamat = $data['alamat'] ?? null;
        $stmt->bindValue(':alamat', $alamat, $alamat === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        
        $stmt->execute();
        
        Response::success(null, 'Supplier berhasil diupdate');
    } catch (PDOException $e) {
        error_log("Update supplier error: " . $e->getMessage());
        Response::serverError('Gagal mengupdate supplier');
    }
}

// ============================================
// DELETE SUPPLIER
// ============================================
// ============================================
if ($method === 'DELETE') {
    Csrf::validate();
    if (!$id) {
        Response::error('ID supplier harus disertakan', 400);
    }
    
    if ($_SESSION['role'] !== 'Owner') {
        Response::error('Akses ditolak. Hanya Owner yang dapat menghapus supplier.', 403);
    }
    
    try {
        // Check if supplier has active debts
        $checkQuery = "SELECT COUNT(*) as count FROM hutang_supplier WHERE supplier_id = :id AND status = 'Belum Lunas'";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        $debtCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($debtCount > 0) {
            Response::error('Supplier tidak dapat dihapus karena masih memiliki hutang aktif', 400);
        }
        
        // Check if supplier has pembelian history
        $checkBuyQuery = "SELECT COUNT(*) as count FROM pembelian WHERE supplier_id = :id";
        $checkBuyStmt = $db->prepare($checkBuyQuery);
        $checkBuyStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkBuyStmt->execute();
        $buyCount = $checkBuyStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($buyCount > 0) {
            Response::error('Supplier tidak dapat dihapus karena sudah memiliki riwayat pembelian', 400);
        }
        
        $query = "DELETE FROM supplier WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Supplier berhasil dihapus');
        } else {
            Response::notFound('Supplier tidak ditemukan');
        }
    } catch (PDOException $e) {
        error_log("Delete supplier error: " . $e->getMessage());
        Response::serverError('Gagal menghapus supplier');
    }
}

Response::error('Invalid method', 405);
