<?php
/**
 * Pembelian API (Stok Masuk)
 * GET  /api/pembelian.php           -> Get all pembelian
 * GET  /api/pembelian.php?id=1      -> Get single pembelian with details
 * POST /api/pembelian.php           -> Create pembelian
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

// Check role - only Admin/Owner can access
if ($_SESSION['role'] === 'Kasir') {
    Response::error('Akses ditolak. Hanya Admin/Owner yang dapat mengakses pembelian.', 403);
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError('Database connection failed');
}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// ============================================
// GET ALL PEMBELIAN
// ============================================
if ($method === 'GET' && !$id) {
    try {
        $query = "SELECT p.*, s.nama as supplier_nama, u.nama as user_nama 
                  FROM pembelian p
                  LEFT JOIN supplier s ON p.supplier_id = s.id
                  LEFT JOIN users u ON p.user_id = u.id
                  ORDER BY p.tanggal DESC
                  LIMIT 200";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $pembelianList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Attach detail items per pembelian (1 query, no N+1)
        if (!empty($pembelianList)) {
            $ids = array_column($pembelianList, 'id');
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $detailQuery = "SELECT pd.*, b.nama as barang_nama, b.kode as barang_kode
                            FROM pembelian_detail pd
                            LEFT JOIN barang b ON pd.barang_id = b.id
                            WHERE pd.pembelian_id IN ($placeholders)";
            $detailStmt = $db->prepare($detailQuery);
            $detailStmt->execute($ids);
            $detailRows = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $itemsByPembelian = [];
            foreach ($detailRows as $row) {
                $itemsByPembelian[$row['pembelian_id']][] = $row;
            }
            foreach ($pembelianList as &$p) {
                $p['items'] = $itemsByPembelian[$p['id']] ?? [];
            }
            unset($p);
        }
        
        Response::success($pembelianList);
    } catch (PDOException $e) {
        error_log("Get pembelian error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data pembelian');
    }
}

// ============================================
// GET SINGLE PEMBELIAN WITH DETAILS
// ============================================
if ($method === 'GET' && $id) {
    try {
        // Get pembelian header
        $query = "SELECT p.*, s.nama as supplier_nama, u.nama as user_nama 
                  FROM pembelian p
                  LEFT JOIN supplier s ON p.supplier_id = s.id
                  LEFT JOIN users u ON p.user_id = u.id
                  WHERE p.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $pembelian = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pembelian) {
            Response::notFound('Pembelian tidak ditemukan');
        }
        
        // Get pembelian details
        $detailQuery = "SELECT pd.*, b.nama as barang_nama, b.kode as barang_kode
                        FROM pembelian_detail pd
                        LEFT JOIN barang b ON pd.barang_id = b.id
                        WHERE pd.pembelian_id = :pembelian_id";
        $detailStmt = $db->prepare($detailQuery);
        $detailStmt->bindParam(':pembelian_id', $id, PDO::PARAM_INT);
        $detailStmt->execute();
        
        $pembelian['items'] = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($pembelian);
    } catch (PDOException $e) {
        error_log("Get pembelian detail error: " . $e->getMessage());
        Response::serverError('Gagal mengambil detail pembelian');
    }
}

// ============================================
// CREATE PEMBELIAN
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields (exclude 'items' - array type handled separately)
    $required = ['supplier_id', 'tanggal', 'status_bayar'];
    $errors = Validator::required($data, $required);
    
    if ($errors) {
        Response::validationError($errors);
    }
    
    if (empty($data['items']) || !is_array($data['items'])) {
        Response::error('Items pembelian tidak boleh kosong', 400);
    }
    
    if (!Validator::isValidDate($data['tanggal'])) {
        Response::error('Format tanggal tidak valid (gunakan YYYY-MM-DD)', 400);
    }
    
    // Tanggal pembelian tidak boleh masa depan
    if ($data['tanggal'] > date('Y-m-d')) {
        Response::error('Tanggal pembelian tidak boleh melebihi hari ini', 400);
    }
    
    if (!in_array($data['status_bayar'], ['Lunas', 'Hutang'], true)) {
        Response::error('Status bayar tidak valid', 400);
    }
    
    if ($data['status_bayar'] === 'Hutang') {
        if (empty($data['jatuh_tempo'])) {
            Response::error('Jatuh tempo harus diisi untuk pembelian hutang', 400);
        }
        if (!Validator::isValidDate($data['jatuh_tempo'])) {
            Response::error('Format tanggal jatuh tempo tidak valid (gunakan YYYY-MM-DD)', 400);
        }
        // BUG-07: jatuh tempo tidak boleh lebih awal dari tanggal pembelian
        // (hari yang sama boleh — kebijakan bisnis Pedro)
        if ($data['jatuh_tempo'] < $data['tanggal']) {
            Response::error('Jatuh tempo tidak boleh lebih awal dari tanggal pembelian', 400);
        }
    }
    
    $supplierId = $data['supplier_id'];
    $tanggal = $data['tanggal'];
    $statusBayar = $data['status_bayar'];
    $metodeBayar = $data['metode_bayar'] ?? null;
    $jatuhTempo = $data['jatuh_tempo'] ?? null;
    $idempotencyKey = $data['idempotency_key'] ?? null;
    // Normalisasi: string kosong -> NULL (kolom DATE menolak '')
    // Untuk Lunas, jatuh tempo tidak relevan; untuk Hutang, metode bayar tidak relevan.
    if ($jatuhTempo === '') {
        $jatuhTempo = null;
    }
    if ($statusBayar === 'Lunas') {
        $jatuhTempo = null;
    } else {
        $metodeBayar = null;
    }
    
    // --- Validasi supplier harus ada ---
    $suppCheck = $db->prepare("SELECT id FROM supplier WHERE id = :id LIMIT 1");
    $suppCheck->bindParam(':id', $supplierId, PDO::PARAM_INT);
    $suppCheck->execute();
    if (!$suppCheck->fetch()) {
        Response::error('Supplier tidak ditemukan', 400);
    }

    // --- Validasi metode pembayaran (hanya saat Lunas) ---
    if ($statusBayar === 'Lunas') {
        $allowedMethods = ['Tunai', 'Transfer', 'QRIS'];
        if (!in_array($metodeBayar, $allowedMethods, true)) {
            Response::error('Metode pembayaran tidak valid', 400);
        }
    }
    
    // --- Validasi format idempotency key ---
    if ($idempotencyKey !== null && !preg_match('/^[A-Za-z0-9-]{8,64}$/', $idempotencyKey)) {
        Response::error('Idempotency key tidak valid', 400);
    }
    
    // --- Validasi item: jumlah integer >= 1, harga_beli >= 0 ---
    // (cegah stok berkurang via jumlah negatif & total aneh via harga negatif)
    $qtyPerBarang = []; // akumulasi jumlah per barang_id (cegah bypass batas via duplikat)
    foreach ($data['items'] as $item) {
        $barangId = $item['barang_id'] ?? null;
        $jumlah = $item['jumlah'] ?? null;
        $hargaBeli = $item['harga_beli'] ?? null;
        
        if (!is_numeric($barangId) || (int)$barangId <= 0) {
            Response::error('ID barang tidak valid', 400);
        }
        if (!is_numeric($jumlah) || (float)$jumlah != (int)$jumlah || (int)$jumlah < 1) {
            Response::error('Jumlah beli harus bilangan bulat minimal 1', 400);
        }
        if ((int)$jumlah > 1000000) {
            Response::error('Jumlah beli melebihi batas maksimum (1.000.000)', 400);
        }
        if (!is_numeric($hargaBeli) || (float)$hargaBeli < 0) {
            Response::error('Harga beli tidak boleh negatif', 400);
        }
        if ((float)$hargaBeli > 999999999999.99) {
            Response::error('Harga beli melebihi batas maksimum', 400);
        }

        $bid = (int)$barangId;
        $qtyPerBarang[$bid] = ($qtyPerBarang[$bid] ?? 0) + (int)$jumlah;
        if ($qtyPerBarang[$bid] > 1000000) {
            Response::error('Total jumlah beli per barang melebihi batas maksimum (1.000.000)', 400);
        }
    }
    
    $items = $data['items'];
    
    // --- Idempotency: key yang sudah diproses → kembalikan pembelian lama ---
    if ($idempotencyKey) {
        $dupCheck = $db->prepare("SELECT id, nomor FROM pembelian WHERE idempotency_key = :key LIMIT 1");
        $dupCheck->bindParam(':key', $idempotencyKey);
        $dupCheck->execute();
        $existing = $dupCheck->fetch(PDO::FETCH_ASSOC);
        if ($existing) {
            Response::success($existing, 'Pembelian sudah pernah diproses');
        }
    }
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // 1. Calculate total
        $total = 0;
        foreach ($items as $item) {
            if (!isset($item['barang_id']) || !isset($item['jumlah']) || !isset($item['harga_beli'])) {
                $db->rollBack();
                Response::error('Item harus memiliki barang_id, jumlah, dan harga_beli', 400);
            }
            $total += $item['harga_beli'] * $item['jumlah'];
        }

        // Cegah overflow DECIMAL(15,2): tolak sebelum INSERT
        if ($total > 9999999999999.99) {
            $db->rollBack();
            Response::error('Total pembelian melebihi batas maksimum sistem', 400);
        }
        
        // 2. Insert pembelian header dengan nomor sementara
        // (nomor final dihitung dari auto-increment ID setelah insert → anti duplikat)
        $tempNomor = 'BUY-TMP-' . bin2hex(random_bytes(4));
        $insertQuery = "INSERT INTO pembelian 
                        (nomor, tanggal, supplier_id, total, status_bayar, metode_bayar, jatuh_tempo, user_id, idempotency_key) 
                        VALUES 
                        (:nomor, :tanggal, :supplier_id, :total, :status_bayar, :metode_bayar, :jatuh_tempo, :user_id, :idempotency_key)";
        $stmt = $db->prepare($insertQuery);
        
        $stmt->bindParam(':nomor', $tempNomor);
        $stmt->bindParam(':tanggal', $tanggal);
        $stmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
        $stmt->bindParam(':total', $total);
        $stmt->bindParam(':status_bayar', $statusBayar);
        // Kolom nullable: bind NULL eksplisit.
        // (bindParam default PARAM_STR mengubah null jadi string kosong '' → error 1292)
        if ($metodeBayar === null) {
            $stmt->bindValue(':metode_bayar', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindParam(':metode_bayar', $metodeBayar);
        }
        if ($jatuhTempo === null) {
            $stmt->bindValue(':jatuh_tempo', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindParam(':jatuh_tempo', $jatuhTempo);
        }
        $stmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
        if ($idempotencyKey === null) {
            $stmt->bindValue(':idempotency_key', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindParam(':idempotency_key', $idempotencyKey);
        }
        
        $stmt->execute();
        $pembelianId = $db->lastInsertId();
        
        // 2b. Nomor final unik dari ID (BUY-YYYYMMDD-0001)
        $dateStr = str_replace('-', '', $tanggal);
        $nomorPembelian = "BUY-{$dateStr}-" . str_pad($pembelianId, 4, '0', STR_PAD_LEFT);
        $nomorStmt = $db->prepare("UPDATE pembelian SET nomor = :nomor WHERE id = :id");
        $nomorStmt->bindParam(':nomor', $nomorPembelian);
        $nomorStmt->bindParam(':id', $pembelianId, PDO::PARAM_INT);
        $nomorStmt->execute();
        
        // 4. Insert pembelian details and increase stock
        foreach ($items as $item) {
            // Insert detail
            $insertDetailQuery = "INSERT INTO pembelian_detail 
                                  (pembelian_id, barang_id, jumlah, harga_beli, subtotal) 
                                  VALUES 
                                  (:pembelian_id, :barang_id, :jumlah, :harga_beli, :subtotal)";
            $detailStmt = $db->prepare($insertDetailQuery);
            
            $subtotal = $item['harga_beli'] * $item['jumlah'];
            
            $detailStmt->bindParam(':pembelian_id', $pembelianId, PDO::PARAM_INT);
            $detailStmt->bindParam(':barang_id', $item['barang_id'], PDO::PARAM_INT);
            $detailStmt->bindParam(':jumlah', $item['jumlah'], PDO::PARAM_INT);
            $detailStmt->bindParam(':harga_beli', $item['harga_beli']);
            $detailStmt->bindParam(':subtotal', $subtotal);
            
            $detailStmt->execute();
            
            // Update stok manual di sini (pengganti trigger trg_after_pembelian_detail_insert).
            // Trigger dihapus dari schema agar app jalan di hosting tanpa hak TRIGGER.
            $stokStmt = $db->prepare("UPDATE barang SET stok = stok + :jumlah WHERE id = :barang_id");
            $stokStmt->bindParam(':jumlah', $item['jumlah'], PDO::PARAM_INT);
            $stokStmt->bindParam(':barang_id', $item['barang_id'], PDO::PARAM_INT);
            $stokStmt->execute();
        }
        
        // 5. If Hutang, create hutang record
        if ($statusBayar === 'Hutang') {
            $insertHutangQuery = "INSERT INTO hutang_supplier 
                                  (pembelian_id, supplier_id, total_hutang, sudah_dibayar, sisa_hutang, jatuh_tempo, status) 
                                  VALUES 
                                  (:pembelian_id, :supplier_id, :total_hutang, 0, :sisa_hutang, :jatuh_tempo, 'Belum Lunas')";
            $hutangStmt = $db->prepare($insertHutangQuery);
            
            $hutangStmt->bindParam(':pembelian_id', $pembelianId, PDO::PARAM_INT);
            $hutangStmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
            $hutangStmt->bindParam(':total_hutang', $total);
            $hutangStmt->bindParam(':sisa_hutang', $total);
            $hutangStmt->bindParam(':jatuh_tempo', $jatuhTempo);
            
            $hutangStmt->execute();
        }
        
        // Commit transaction
        $db->commit();
        
        Response::success([
            'id' => $pembelianId,
            'nomor' => $nomorPembelian,
            'total' => $total
        ], 'Pembelian berhasil disimpan', 201);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Create pembelian error: " . $e->getMessage());
        // Race condition idempotency: ambil pembelian yang sudah ada
        if ($idempotencyKey && $e->getCode() == 23000) {
            $dupStmt = $db->prepare("SELECT id, nomor FROM pembelian WHERE idempotency_key = :key LIMIT 1");
            $dupStmt->bindParam(':key', $idempotencyKey);
            $dupStmt->execute();
            $existing = $dupStmt->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                Response::success($existing, 'Pembelian sudah pernah diproses');
            }
        }
        Response::serverError('Gagal menyimpan pembelian. Silakan coba lagi.');
    }
}

Response::error('Invalid method', 405);
