<?php
/**
 * Authentication API
 * POST /api/auth.php?action=login
 * POST /api/auth.php?action=logout
 * GET  /api/auth.php?action=check
 * POST /api/auth.php?action=change-password  (butuh login + CSRF)
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

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================
// RATE LIMIT LOGIN: 5x gagal / 15 menit -> kunci 15 menit (per IP + username)
// ============================================
define('LOGIN_MAX_ATTEMPTS', 5);
define('LOGIN_BLOCK_SECONDS', 900); // 15 menit

function loginRateLimited($db, $ip, $username) {
    try {
        $stmt = $db->prepare("SELECT attempts, last_attempt FROM login_attempts WHERE ip = :ip AND username = :username");
        $stmt->bindParam(':ip', $ip);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || (int)$row['attempts'] < LOGIN_MAX_ATTEMPTS) {
            return false;
        }
        // Blokir hangus setelah 15 menit sejak percobaan terakhir
        if (time() - strtotime($row['last_attempt']) >= LOGIN_BLOCK_SECONDS) {
            $del = $db->prepare("DELETE FROM login_attempts WHERE ip = :ip AND username = :username");
            $del->bindParam(':ip', $ip);
            $del->bindParam(':username', $username);
            $del->execute();
            return false;
        }
        return true;
    } catch (PDOException $e) {
        error_log("Rate limit check error: " . $e->getMessage());
        return false; // fail-open: jangan kunci login gara-gara error DB
    }
}

function recordFailedLogin($db, $ip, $username) {
    try {
        $stmt = $db->prepare(
            "INSERT INTO login_attempts (ip, username, attempts, last_attempt) VALUES (:ip, :username, 1, NOW())
             ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt = NOW()"
        );
        $stmt->bindParam(':ip', $ip);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
    } catch (PDOException $e) {
        error_log("Record failed login error: " . $e->getMessage());
    }
}

function clearFailedLogins($db, $ip, $username) {
    try {
        $stmt = $db->prepare("DELETE FROM login_attempts WHERE ip = :ip AND username = :username");
        $stmt->bindParam(':ip', $ip);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
    } catch (PDOException $e) {
        error_log("Clear failed logins error: " . $e->getMessage());
    }
}

// ============================================
// LOGIN
// ============================================
if ($action === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        Response::error('Username dan password harus diisi', 400);
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (loginRateLimited($db, $ip, $username)) {
        Response::error('Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.', 429);
    }
    
    try {
        // Kolom is_active hanya ada setelah migrasi-keamanan.sql dijalankan;
        // tanpa migrasi, lewati cek status (tetap bisa login seperti dulu)
        $hasIsActive = false;
        try {
            $colCheck = $db->query("SHOW COLUMNS FROM users LIKE 'is_active'");
            $hasIsActive = $colCheck && $colCheck->fetch() !== false;
        } catch (PDOException $e) { /* abaikan */ }

        // Get user by username first
        $query = "SELECT id, username, nama, role, password"
            . ($hasIsActive ? ", is_active" : "")
            . " FROM users WHERE username = :username LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password (bcrypt; plaintext didukung sementara untuk migrasi
        // akun lama — otomatis di-upgrade ke bcrypt saat login berhasil)
        $passwordMatch = false;
        $needsRehash = false;
        if ($user) {
            // Try bcrypt first
            if (password_verify($password, $user['password'])) {
                $passwordMatch = true;
            }
            // Fallback plaintext: hanya untuk akun lama, langsung migrasi ke bcrypt
            elseif ($password === $user['password']) {
                $passwordMatch = true;
                $needsRehash = true;
            }
        }
        
        if ($user && $passwordMatch) {
            // Akun nonaktif tidak boleh login
            if (isset($user['is_active']) && (int)$user['is_active'] === 0) {
                recordFailedLogin($db, $ip, $username);
                Response::error('Akun ini dinonaktifkan. Hubungi Owner.', 403);
            }
            // Login sukses: reset hitungan gagal
            clearFailedLogins($db, $ip, $username);
            // Migrasi transparan: simpan hash bcrypt agar fallback tak terpakai lagi
            if ($needsRehash) {
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                $rehashStmt = $db->prepare("UPDATE users SET password = :hash WHERE id = :id");
                $rehashStmt->bindParam(':hash', $newHash);
                $rehashStmt->bindParam(':id', $user['id'], PDO::PARAM_INT);
                $rehashStmt->execute();
            }
            // Cegah session fixation: buat session ID baru setelah login
            session_regenerate_id(true);
            // Remove password from response
            unset($user['password']);
            unset($user['is_active']);
            // Store user in session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['nama'] = $user['nama'];
            $_SESSION['role'] = $user['role'];
            
            Response::success([
                'user' => $user,
                'csrf_token' => Csrf::token()
            ], 'Login berhasil');
        } else {
            recordFailedLogin($db, $ip, $username);
            Response::error('Username atau password salah', 401);
        }
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        Response::serverError('Login gagal');
    }
}

// ============================================
// CHECK SESSION
// ============================================
if ($action === 'check' && $method === 'GET') {
    if (isset($_SESSION['user_id'])) {
        Response::success([
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'nama' => $_SESSION['nama'],
                'role' => $_SESSION['role']
            ],
            'csrf_token' => Csrf::token()
        ], 'Session active');
    } else {
        Response::unauthorized('No active session');
    }
}

// ============================================
// CHANGE PASSWORD (user ganti password sendiri)
// ============================================
if ($action === 'change-password' && $method === 'POST') {
    Csrf::validate();
    if (!isset($_SESSION['user_id'])) {
        Response::unauthorized('Harus login terlebih dahulu');
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $oldPassword = $data['old_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';

    if (empty($oldPassword) || empty($newPassword)) {
        Response::error('Password lama dan password baru harus diisi', 400);
    }
    if (strlen($newPassword) < 8) {
        Response::error('Password baru minimal 8 karakter', 400);
    }
    if ($oldPassword === $newPassword) {
        Response::error('Password baru tidak boleh sama dengan password lama', 400);
    }

    try {
        $stmt = $db->prepare("SELECT password FROM users WHERE id = :id LIMIT 1");
        $stmt->bindParam(':id', $_SESSION['user_id'], PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            Response::notFound('User tidak ditemukan');
        }

        // Verifikasi password lama (bcrypt; fallback plaintext untuk akun pra-migrasi)
        $oldMatch = password_verify($oldPassword, $row['password']) || $oldPassword === $row['password'];
        if (!$oldMatch) {
            Response::error('Password lama salah', 401);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $upd = $db->prepare("UPDATE users SET password = :hash WHERE id = :id");
        $upd->bindParam(':hash', $newHash);
        $upd->bindParam(':id', $_SESSION['user_id'], PDO::PARAM_INT);
        $upd->execute();

        Response::success(null, 'Password berhasil diubah');
    } catch (PDOException $e) {
        error_log("Change password error: " . $e->getMessage());
        Response::serverError('Gagal mengubah password');
    }
}

// ============================================
// LOGOUT
// ============================================
if ($action === 'logout' && $method === 'POST') {
    Csrf::validate();
    session_unset();
    session_destroy();
    Response::success(null, 'Logout berhasil');
}

// Default: Method not allowed
Response::error('Invalid action or method', 405);
