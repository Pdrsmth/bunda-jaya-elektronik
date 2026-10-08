<?php
/**
 * Secure session bootstrap.
 *
 * Pakai ini sebagai pengganti session_start() mentah di semua endpoint API.
 * - HttpOnly: cookie session tidak bisa dibaca JavaScript (tahan pencurian via XSS)
 * - SameSite=Lax: cookie tidak dikirim pada request cross-site (tahan CSRF)
 * - Secure: otomatis aktif hanya saat koneksi HTTPS (aman di localhost HTTP)
 */
function startSecureSession() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_set_cookie_params([
        'lifetime' => 0,          // session cookie (hangus saat browser ditutup)
        'path'     => '/',
        'httponly' => true,
        'secure'   => $isHttps,
        'samesite' => 'Lax',
    ]);

    session_start();
}
