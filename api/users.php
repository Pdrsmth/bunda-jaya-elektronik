<?php
/**
 * User Management API (khusus Owner)
 * GET    /api/users.php            -> daftar user (tanpa hash password)
 * POST   /api/users.php            -> tambah user {username, nama, password, role}
 * PUT    /api/users.php            -> update user {id, nama?, role?, is_active?, password?}
 *
 * Role Kasir dinonaktifkan: user baru hanya boleh Owner/Admin.
 * Nonaktifkan akun via is_active (hapus baris diblokir FK jika user pernah transaksi).
 */

require_once 'utils/Session.php';
startSecureSession();

require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'utils/Response.php';
require_once 'utils/Csrf.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::serverError('Database connection failed');
}

if (!isset($_SESSION['user_id'])) {
    Response::unauthorized('Harus login terlebih dahulu');
}

if ($_SESSION['role'] !== 'Owner') {
    Response::error('Akses ditolak. Hanya Owner yang dapat mengelola user.', 403);
}

$method = $_SERVER['REQUEST_METHOD'];
$hasIsActive = false;
try {
    $colCheck = $db->query("SHOW COLUMNS FROM users LIKE 'is_active'");
    $hasIsActive = $colCheck && $colCheck->fetch() !== false;
} catch (PDOException $e) { /* abaikan: migrasi belum jalan */ }

// ============================================
// GET: daftar user
// ============================================
if ($method === 'GET') {
    try {
        $cols = "id, username, nama, role" . ($hasIsActive ? ", is_active" : "") . ", created_at";
        $stmt = $db->query("SELECT $cols FROM users ORDER BY id ASC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($users);
    } catch (PDOException $e) {
        error_log("Get users error: " . $e->getMessage());
        Response::serverError('Gagal mengambil data user');
    }
}

// ============================================
// POST: tambah user baru
// ============================================
if ($method === 'POST') {
    Csrf::validate();
    $data = json_decode(file_get_contents("php://input"), true);

    $username = trim($data['username'] ?? '');
    $nama     = trim($data['nama'] ?? '');
    $password = $data['password'] ?? '';
    $role     = $data['role'] ?? '';

    if ($username === '' || $nama === '' || $password === '' || $role === '') {
        Response::error('Username, nama, password, dan role harus diisi', 400);
    }
    if (!preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username)) {
        Response::error('Username 3-50 karakter, hanya huruf/angka/underscore', 400);
    }
    if (strlen($password) < 8) {
        Response::error('Password minimal 8 karakter', 400);
    }
    if (!in_array($role, ['Owner', 'Admin'], true)) {
        Response::error('Role tidak valid (hanya Owner/Admin)', 400);
    }

    try {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (username, password, nama, role) VALUES (:username, :password, :nama, :role)");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $hash);
        $stmt->bindParam(':nama', $nama);
        $stmt->bindParam(':role', $role);
        $stmt->execute();
        Response::success(['id' => (int)$db->lastInsertId()], 'User baru berhasil ditambahkan');
    } catch (PDOException $e) {
        if ((int)$e->getCode() === 23000) {
            Response::error('Username sudah dipakai', 409);
        }
        error_log("Create user error: " . $e->getMessage());
        Response::serverError('Gagal menambah user');
    }
}

// ============================================
// PUT: update user (nama/role/status) atau reset password
// ============================================
if ($method === 'PUT') {
    Csrf::validate();
    $data = json_decode(file_get_contents("php://input"), true);

    $id = $data['id'] ?? null;
    if (!$id || !is_numeric($id)) {
        Response::error('ID user harus disertakan', 400);
    }
    $id = (int)$id;

    try {
        $check = $db->prepare("SELECT id, username, role FROM users WHERE id = :id LIMIT 1");
        $check->bindParam(':id', $id, PDO::PARAM_INT);
        $check->execute();
        $target = $check->fetch(PDO::FETCH_ASSOC);
        if (!$target) {
            Response::notFound('User tidak ditemukan');
        }

        $isSelf = ($id === (int)$_SESSION['user_id']);

        $sets = [];
        $params = [];

        // Nama
        if (array_key_exists('nama', $data)) {
            $nama = trim($data['nama']);
            if ($nama === '') {
                Response::error('Nama tidak boleh kosong', 400);
            }
            $sets[] = "nama = :nama";
            $params[':nama'] = $nama;
        }

        // Role (tidak boleh ubah role diri sendiri -> cegah lockout)
        if (array_key_exists('role', $data)) {
            if ($isSelf) {
                Response::error('Tidak dapat mengubah role akun sendiri', 400);
            }
            if (!in_array($data['role'], ['Owner', 'Admin'], true)) {
                Response::error('Role tidak valid (hanya Owner/Admin)', 400);
            }
            $sets[] = "role = :role";
            $params[':role'] = $data['role'];
        }

        // Status aktif (tidak boleh nonaktifkan diri sendiri)
        if (array_key_exists('is_active', $data)) {
            if (!$hasIsActive) {
                Response::error('Jalankan migrasi-keamanan.sql dulu untuk fitur nonaktif user', 400);
            }
            $active = (int)$data['is_active'] ? 1 : 0;
            if ($isSelf && $active === 0) {
                Response::error('Tidak dapat menonaktifkan akun sendiri', 400);
            }
            $sets[] = "is_active = :is_active";
            $params[':is_active'] = $active;
        }

        // Reset password oleh Owner
        if (array_key_exists('password', $data) && $data['password'] !== '' && $data['password'] !== null) {
            if (strlen($data['password']) < 8) {
                Response::error('Password baru minimal 8 karakter', 400);
            }
            $sets[] = "password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (empty($sets)) {
            Response::error('Tidak ada perubahan yang dikirim', 400);
        }

        $sql = "UPDATE users SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        Response::success(null, 'Data user berhasil diperbarui');
    } catch (PDOException $e) {
        error_log("Update user error: " . $e->getMessage());
        Response::serverError('Gagal memperbarui user');
    }
}

// Default
Response::error('Invalid method', 405);
