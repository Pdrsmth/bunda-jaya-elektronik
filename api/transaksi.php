<?php
/**
 * Transaksi API (POS)
 * GET  /api/transaksi.php                -> Get all transaksi
 * GET  /api/transaksi.php?id=1           -> Get single transaksi with details
 * POST /api/transaksi.php                -> Create transaksi (Checkout POS)
 * GET  /api/transaksi.php?action=history -> Get transaction history with filters
 */

require_once 'utils/Session.php';
startSecureSession();

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';
require_once 'utils/Csrf.php';
require_once 'utils/Validator.php';

/**
 * Ambil transaksi lengkap (header + detail) berdasarkan idempotency key.
 * Dipakai untuk mengembalikan transaksi yang sudah pernah diproses (anti double submit).
 */
function fetchTransaksiFull($db, $idempotencyKey) {
    $q = "SELECT t.*, u.nama as kasir_nama
          FROM transaksi t
          LEFT JOIN users u ON t.kasir_id = u.id
          WHERE t.idempotency_key = :key LIMIT 1";
    $stmt = $db->prepare($q);
    $stmt->bindParam(':key', $idempotencyKey);
    $stmt->execute();
    $trx = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$trx) {
        return null;
    }
    $dq = "SELECT td.*, b.nama as barang_nama, b.kode as barang_kode
           FROM transaksi_detail td
           LEFT JOIN barang b ON td.barang_id = b.id
           WHERE td.transaksi_id = :id";
    $dstmt = $db->prepare($dq);
    $dstmt->bindParam(':id', $trx['id'], PDO::PARAM_INT);
    $dstmt->execute();
    $trx['items'] = $dstmt->fetchAll(PDO::FETCH_ASSOC);
    // Samakan bentuk response dengan hasil checkout normal (untuk struk)
    $trx['sisa_piutang'] = 0;
    $trx['pelanggan_nama'] = null;
    if ($trx['metode_bayar'] === 'Kredit') {
        $pq = "SELECT sisa_piutang, pelanggan_nama FROM piutang_pelanggan WHERE transaksi_id = :id LIMIT 1";
        $pstmt = $db->prepare($pq);
        $pstmt->bindParam(':id', $trx['id'], PDO::PARAM_INT);
        $pstmt->execute();
        $piutang = $pstmt->fetch(PDO::FETCH_ASSOC);
        if ($piutang) {
            $trx['sisa_piutang'] = (float)$piutang['sisa_piutang'];
            $trx['pelanggan_nama'] = $piutang['pelanggan_nama'];
        }
    }
    return $trx;
}

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
$action = $_GET['action'] ?? '';

// ============================================
// GET ALL TRANSAKSI
// ============================================
if ($method === 'GET' && !$id && $action !== 'history') {
    try {
        $query = "SELECT t.*, u.nama as kasir_nama 
                  FROM transaksi t
                  LEFT JOIN users u ON t.kasir_id = u.id
                  ORDER BY t.tanggal DESC
                  LIMIT 100";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $transaksiList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Attach detail items per transaksi (1 query, no N+1)
        // (tanpa ini kolom "Total Item" di histori selalu 0)
        if (!empty($transaksiList)) {
            $ids = array_column($transaksiList, 'id');
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $detailQuery = "SELECT td.*, b.nama as barang_nama, b.kode as barang_kode
                            FROM transaksi_detail td
                            LEFT JOIN barang b ON td.barang_id = b.id
                            WHERE td.transaksi_id IN ($placeholders)";
            $detailStmt = $db->prepare($detailQuery);
            $detailStmt->execute($ids);
            $detailRows = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $itemsByTransaksi = [];
            foreach ($detailRows as $row) {
                $itemsByTransaksi[$row['transaksi_id']][] = $row;
            }
            foreach ($transaksiList as &$t) {
                $t['items'] = $itemsByTransaksi[$t['id']] ?? [];
            }
            unset($t);
        }
        
        Response::success($transaksiList);
    } catch (PDOException $e) {
        error_log("Get transaksi error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data transaksi');
    }
}

// ============================================
// GET SINGLE TRANSAKSI WITH DETAILS
// ============================================
if ($method === 'GET' && $id) {
    try {
        // Get transaksi header
        $query = "SELECT t.*, u.nama as kasir_nama 
                  FROM transaksi t
                  LEFT JOIN users u ON t.kasir_id = u.id
                  WHERE t.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $transaksi = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transaksi) {
            Response::notFound('Transaksi tidak ditemukan');
        }
        
        // Get transaksi details (items)
        $detailQuery = "SELECT td.*, b.nama as barang_nama, b.kode as barang_kode
                        FROM transaksi_detail td
                        LEFT JOIN barang b ON td.barang_id = b.id
                        WHERE td.transaksi_id = :transaksi_id";
        $detailStmt = $db->prepare($detailQuery);
        $detailStmt->bindParam(':transaksi_id', $id, PDO::PARAM_INT);
        $detailStmt->execute();
        
        $transaksi['items'] = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::success($transaksi);
    } catch (PDOException $e) {
        error_log("Get transaksi detail error: " . $e->getMessage());
        Response::serverError('Gagal mengambil detail transaksi');
    }
}

// ============================================
// CREATE TRANSAKSI (POS CHECKOUT)
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (empty($data['items']) || !is_array($data['items'])) {
        Response::error('Keranjang tidak boleh kosong', 400);
    }
    
    if (empty($data['metode_bayar'])) {
        Response::error('Metode pembayaran harus dipilih', 400);
    }
    
    $items = $data['items'];
    $discountType = $data['diskon_tipe'] ?? null;
    $discountValue = $data['diskon_nilai'] ?? 0;
    // diskon_amount TIDAK dipercaya dari client — dihitung ulang di server di bawah
    $paymentMethod = $data['metode_bayar'];
    $paidAmount = $data['jumlah_bayar'] ?? 0;
    $idempotencyKey = $data['idempotency_key'] ?? null;
    
    // --- Validasi metode pembayaran ---
    $allowedMethods = ['Tunai', 'Transfer', 'QRIS', 'Kredit'];
    if (!in_array($paymentMethod, $allowedMethods, true)) {
        Response::error('Metode pembayaran tidak valid', 400);
    }
    
    // --- Validasi format idempotency key ---
    if ($idempotencyKey !== null && !preg_match('/^[A-Za-z0-9-]{8,64}$/', $idempotencyKey)) {
        Response::error('Idempotency key tidak valid', 400);
    }
    
    // --- Validasi & gabung item ---
    // - jumlah harus bilangan bulat >= 1 (cegah negatif/pecahan → manipulasi stok)
    // - barang_id duplikat digabung dulu agar cek stok kumulatif (cegah stok negatif)
    $mergedItems = [];
    foreach ($items as $item) {
        $barangId = $item['barang_id'] ?? null;
        $jumlah = $item['jumlah'] ?? null;
        
        if (!is_numeric($barangId) || (int)$barangId <= 0) {
            Response::error('ID barang tidak valid', 400);
        }
        if (!is_numeric($jumlah) || (float)$jumlah != (int)$jumlah || (int)$jumlah < 1) {
            Response::error('Jumlah barang harus bilangan bulat minimal 1', 400);
        }
        $jumlah = (int)$jumlah;
        if ($jumlah > 1000000) {
            Response::error('Jumlah barang melebihi batas maksimum (1.000.000)', 400);
        }
        
        $bid = (int)$barangId;
        if (!isset($mergedItems[$bid])) {
            $mergedItems[$bid] = ['barang_id' => $bid, 'jumlah' => 0];
        }
        $mergedItems[$bid]['jumlah'] += $jumlah;
    }
    $items = array_values($mergedItems);

    // --- Validasi ulang setelah merge: kumulatif per barang tetap <= batas ---
    foreach ($items as $item) {
        if ($item['jumlah'] > 1000000) {
            Response::error('Jumlah barang melebihi batas maksimum (1.000.000) setelah penggabungan', 400);
        }
    }
    
    // --- Validasi diskon ---
    if (!is_numeric($discountValue) || (float)$discountValue < 0) {
        Response::error('Nilai diskon tidak valid', 400);
    }
    $discountValue = (float)$discountValue;
    if ($discountType !== null && $discountType !== 'Persen' && $discountType !== 'Nominal') {
        Response::error('Tipe diskon tidak valid', 400);
    }
    
    // --- Validasi jumlah bayar ---
    if (!is_numeric($paidAmount) || (float)$paidAmount < 0) {
        Response::error('Jumlah bayar tidak valid', 400);
    }
    $paidAmount = (float)$paidAmount;
    
    // --- Idempotency: key yang sudah diproses → kembalikan transaksi lama ---
    if ($idempotencyKey) {
        $dupCheck = $db->prepare("SELECT id FROM transaksi WHERE idempotency_key = :key LIMIT 1");
        $dupCheck->bindParam(':key', $idempotencyKey);
        $dupCheck->execute();
        if ($dupCheck->fetch(PDO::FETCH_ASSOC)) {
            $existingTx = fetchTransaksiFull($db, $idempotencyKey);
            Response::success($existingTx, 'Transaksi sudah pernah diproses');
        }
    }
    
    try {
        // Start transaction
        $db->beginTransaction();
        
        // 1. Validate stock availability
        $barangList = [];
        foreach ($items as $item) {
            $barangQuery = "SELECT id, nama, stok, harga_beli, harga_jual FROM barang WHERE id = :id FOR UPDATE";
            $barangStmt = $db->prepare($barangQuery);
            $barangStmt->bindParam(':id', $item['barang_id'], PDO::PARAM_INT);
            $barangStmt->execute();
            $barang = $barangStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$barang) {
                $db->rollBack();
                Response::error("Barang dengan ID {$item['barang_id']} tidak ditemukan", 400);
            }
            
            if ($barang['stok'] < $item['jumlah']) {
                $db->rollBack();
                Response::error("Stok barang {$barang['nama']} tidak cukup. Tersedia: {$barang['stok']}", 400);
            }
            
            $barangList[$item['barang_id']] = $barang;
        }
        
        // 2. Calculate totals
        $subtotal = 0;
        foreach ($items as $item) {
            $barang = $barangList[$item['barang_id']];
            $subtotal += $barang['harga_jual'] * $item['jumlah'];
        }

        // Cegah overflow DECIMAL(15,2): tolak sebelum INSERT
        if ($subtotal > 9999999999999.99) {
            $db->rollBack();
            Response::error('Total transaksi melebihi batas maksimum sistem', 400);
        }
        
        // Hitung ulang diskon di server dari tipe & nilai (anti manipulasi client)
        if ($discountType === 'Persen') {
            // BUG-10: diskon >100% ditolak, bukan di-clamp diam-diam
            if ($discountValue < 0 || $discountValue > 100) {
                $db->rollBack();
                Response::error('Diskon persen harus antara 0–100%', 400);
            }
            $discountAmount = ($subtotal * $discountValue) / 100;
        } elseif ($discountType === 'Nominal') {
            $discountAmount = max(0, $discountValue);
        } else {
            $discountType = null;
            $discountValue = 0;
            $discountAmount = 0;
        }
        
        // Diskon tidak boleh melebihi subtotal (mencegah total "gratis" akibat salah input)
        if ($discountAmount > $subtotal) {
            $db->rollBack();
            Response::error('Diskon tidak boleh melebihi subtotal (Rp ' . number_format($subtotal, 0, ',', '.') . ')', 400);
        }
        
        $total = $subtotal - $discountAmount;
        $change = $paymentMethod === 'Tunai' ? max(0, $paidAmount - $total) : 0;
        
        // Validate payment
        $uangMuka = 0;
        $pelangganNama = null;
        $pelangganKontak = null;
        $dpMetode = 'Tunai';
        
        if ($paymentMethod === 'Kredit') {
            // Kredit fleksibel: nama + no HP wajib, uang muka 0..total, cicilan bebas kapan pun
            $pelangganNama = trim($data['pelanggan_nama'] ?? '');
            $pelangganKontak = trim($data['pelanggan_kontak'] ?? '');
            $uangMuka = (float)($data['uang_muka'] ?? 0);
            $dpMetode = $data['dp_metode_bayar'] ?? 'Tunai';
            // BUG-09: metode DP wajib di-whitelist (sama seperti metode bayar lain)
            if (!in_array($dpMetode, ['Tunai', 'Transfer', 'QRIS'], true)) {
                $db->rollBack();
                Response::error('Metode pembayaran DP tidak valid', 400);
            }
            
            if ($pelangganNama === '' || $pelangganKontak === '') {
                $db->rollBack();
                Response::error('Nama dan no. HP pelanggan wajib diisi untuk transaksi kredit', 400);
            }
            if ($uangMuka < 0 || $uangMuka > $total) {
                $db->rollBack();
                Response::error('Uang muka harus antara Rp 0 dan total transaksi', 400);
            }
            $paidAmount = $uangMuka;
            $change = 0;
        } elseif ($paymentMethod === 'Tunai') {
            if ($paidAmount < $total) {
                $db->rollBack();
                Response::error("Jumlah bayar kurang. Total: Rp " . number_format($total, 0, ',', '.'), 400);
            }
        } else {
            // Transfer / Kartu / QRIS: jumlah bayar harus tepat sama dengan total
            if (abs($paidAmount - $total) > 0.01) {
                $db->rollBack();
                Response::error('Untuk pembayaran ' . $paymentMethod . ', jumlah bayar harus tepat Rp ' . number_format($total, 0, ',', '.'), 400);
            }
        }
        
        // 3. Insert transaksi header dengan nomor sementara
        // (nomor final dihitung dari auto-increment ID setelah insert → anti duplikat
        //  meski dua kasir checkout persis di waktu yang sama)
        $tempNomor = 'TRX-TMP-' . bin2hex(random_bytes(4));
        $tanggalTransaksi = date('Y-m-d H:i:s');
        $insertTxQuery = "INSERT INTO transaksi 
                          (nomor, tanggal, kasir_id, subtotal, diskon_tipe, diskon_nilai, diskon_amount, total, metode_bayar, jumlah_bayar, kembalian, idempotency_key) 
                          VALUES 
                          (:nomor, :tanggal, :kasir_id, :subtotal, :diskon_tipe, :diskon_nilai, :diskon_amount, :total, :metode_bayar, :jumlah_bayar, :kembalian, :idempotency_key)";
        $txStmt = $db->prepare($insertTxQuery);
        $txStmt->bindParam(':tanggal', $tanggalTransaksi);
        
        $txStmt->bindParam(':nomor', $tempNomor);
        $txStmt->bindParam(':kasir_id', $_SESSION['user_id'], PDO::PARAM_INT);
        $txStmt->bindParam(':subtotal', $subtotal);
        // Kolom nullable: bind NULL eksplisit (bindParam default PARAM_STR mengubah null jadi '')
        if ($discountType === null) {
            $txStmt->bindValue(':diskon_tipe', null, PDO::PARAM_NULL);
        } else {
            $txStmt->bindParam(':diskon_tipe', $discountType);
        }
        $txStmt->bindParam(':diskon_nilai', $discountValue);
        $txStmt->bindParam(':diskon_amount', $discountAmount);
        $txStmt->bindParam(':total', $total);
        $txStmt->bindParam(':metode_bayar', $paymentMethod);
        $txStmt->bindParam(':jumlah_bayar', $paidAmount);
        $txStmt->bindParam(':kembalian', $change);
        if ($idempotencyKey === null) {
            $txStmt->bindValue(':idempotency_key', null, PDO::PARAM_NULL);
        } else {
            $txStmt->bindParam(':idempotency_key', $idempotencyKey);
        }
        
        $txStmt->execute();
        $transaksiId = $db->lastInsertId();
        
        // 3b. Nomor final unik dari ID (TRX-YYYYMMDD-0001)
        $today = date('Ymd');
        $nomorTransaksi = "TRX-{$today}-" . str_pad($transaksiId, 4, '0', STR_PAD_LEFT);
        $nomorStmt = $db->prepare("UPDATE transaksi SET nomor = :nomor WHERE id = :id");
        $nomorStmt->bindParam(':nomor', $nomorTransaksi);
        $nomorStmt->bindParam(':id', $transaksiId, PDO::PARAM_INT);
        $nomorStmt->execute();
        
        // 5. Insert transaksi details and reduce stock
        foreach ($items as $item) {
            $barang = $barangList[$item['barang_id']];
            
            // Insert detail
            $insertDetailQuery = "INSERT INTO transaksi_detail 
                                  (transaksi_id, barang_id, jumlah, harga_jual, harga_beli, subtotal) 
                                  VALUES 
                                  (:transaksi_id, :barang_id, :jumlah, :harga_jual, :harga_beli, :subtotal)";
            $detailStmt = $db->prepare($insertDetailQuery);
            
            $itemSubtotal = $barang['harga_jual'] * $item['jumlah'];
            
            $detailStmt->bindParam(':transaksi_id', $transaksiId, PDO::PARAM_INT);
            $detailStmt->bindParam(':barang_id', $item['barang_id'], PDO::PARAM_INT);
            $detailStmt->bindParam(':jumlah', $item['jumlah'], PDO::PARAM_INT);
            $detailStmt->bindParam(':harga_jual', $barang['harga_jual']);
            $detailStmt->bindParam(':harga_beli', $barang['harga_beli']);
            $detailStmt->bindParam(':subtotal', $itemSubtotal);
            
            $detailStmt->execute();
            
            // Update stok manual di sini (pengganti trigger trg_after_transaksi_detail_insert).
            // Trigger dihapus dari schema agar app jalan di hosting tanpa hak TRIGGER.
            $stokStmt = $db->prepare("UPDATE barang SET stok = stok - :jumlah WHERE id = :barang_id");
            $stokStmt->bindParam(':jumlah', $item['jumlah'], PDO::PARAM_INT);
            $stokStmt->bindParam(':barang_id', $item['barang_id'], PDO::PARAM_INT);
            $stokStmt->execute();
        }
        
        // 6. Jika Kredit, catat piutang pelanggan (tanpa tenor kaku — cicilan bebas)
        //     DP dicatat sebagai pembayaran pertama agar masuk riwayat & laporan kas.
        $sisaPiutang = 0;
        if ($paymentMethod === 'Kredit') {
            $sisaPiutang = $total - $uangMuka;
            $statusPiutang = $sisaPiutang <= 0 ? 'Lunas' : 'Belum Lunas';
            $piutangStmt = $db->prepare("INSERT INTO piutang_pelanggan
                                          (transaksi_id, pelanggan_nama, pelanggan_kontak, total_piutang, uang_muka, sudah_dibayar, sisa_piutang, status)
                                          VALUES
                                          (:transaksi_id, :nama, :kontak, :total_piutang, :uang_muka, :sudah_dibayar, :sisa, :status)");
            $piutangStmt->bindParam(':transaksi_id', $transaksiId, PDO::PARAM_INT);
            $piutangStmt->bindParam(':nama', $pelangganNama);
            $piutangStmt->bindParam(':kontak', $pelangganKontak);
            $piutangStmt->bindParam(':total_piutang', $total);
            $piutangStmt->bindParam(':uang_muka', $uangMuka);
            $piutangStmt->bindParam(':sudah_dibayar', $uangMuka);
            $piutangStmt->bindParam(':sisa', $sisaPiutang);
            $piutangStmt->bindParam(':status', $statusPiutang);
            $piutangStmt->execute();
            $piutangId = $db->lastInsertId();
            
            if ($uangMuka > 0) {
                $dpStmt = $db->prepare("INSERT INTO pembayaran_piutang
                                        (piutang_id, tanggal_bayar, jumlah_bayar, metode_bayar, user_id)
                                        VALUES
                                        (:piutang_id, CURDATE(), :jumlah_bayar, :metode_bayar, :user_id)");
                $dpStmt->bindParam(':piutang_id', $piutangId, PDO::PARAM_INT);
                $dpStmt->bindParam(':jumlah_bayar', $uangMuka);
                $dpStmt->bindParam(':metode_bayar', $dpMetode);
                $dpStmt->bindParam(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
                $dpStmt->execute();
            }
        }
        
        // Commit transaction
        $db->commit();
        
        // Return transaction data
        $responseData = [
            'id' => $transaksiId,
            'nomor' => $nomorTransaksi,
            'tanggal' => $tanggalTransaksi,
            'total' => $total,
            'kembalian' => $change
        ];
        if ($paymentMethod === 'Kredit') {
            $responseData['sisa_piutang'] = $sisaPiutang;
        }
        Response::success($responseData, 'Transaksi berhasil disimpan', 201);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Create transaksi error: " . $e->getMessage());
        // Race condition idempotency: dua request bersamaan dengan key sama —
        // yang kalah di UNIQUE constraint mengambil transaksi milik pemenang.
        if ($idempotencyKey && $e->getCode() == 23000) {
            $existingTx = fetchTransaksiFull($db, $idempotencyKey);
            if ($existingTx) {
                Response::success($existingTx, 'Transaksi sudah pernah diproses');
            }
        }
        Response::serverError('Gagal menyimpan transaksi. Silakan coba lagi.');
    }
}

// ============================================
// GET TRANSACTION HISTORY (with filters)
// ============================================
if ($method === 'GET' && $action === 'history') {
    try {
        $dateFrom = $_GET['date_from'] ?? null;
        $dateTo = $_GET['date_to'] ?? null;
        $kasirId = $_GET['kasir_id'] ?? null;
        $paymentMethod = $_GET['metode_bayar'] ?? null;
        
        $query = "SELECT t.*, u.nama as kasir_nama 
                  FROM transaksi t
                  LEFT JOIN users u ON t.kasir_id = u.id
                  WHERE 1=1";
        
        if ($dateFrom) {
            $query .= " AND DATE(t.tanggal) >= :date_from";
        }
        if ($dateTo) {
            $query .= " AND DATE(t.tanggal) <= :date_to";
        }
        if ($kasirId) {
            $query .= " AND t.kasir_id = :kasir_id";
        }
        if ($paymentMethod) {
            $query .= " AND t.metode_bayar = :metode_bayar";
        }
        
        $query .= " ORDER BY t.tanggal DESC LIMIT 500";
        
        $stmt = $db->prepare($query);
        
        if ($dateFrom) $stmt->bindParam(':date_from', $dateFrom);
        if ($dateTo) $stmt->bindParam(':date_to', $dateTo);
        if ($kasirId) $stmt->bindParam(':kasir_id', $kasirId, PDO::PARAM_INT);
        if ($paymentMethod) $stmt->bindParam(':metode_bayar', $paymentMethod);
        
        $stmt->execute();
        
        $transaksiList = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($transaksiList);
    } catch (PDOException $e) {
        error_log("Get history error: " . $e->getMessage());
        Response::serverError('Gagal mengambil histori transaksi');
    }
}

Response::error('Invalid method', 405);
