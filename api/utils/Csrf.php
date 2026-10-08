<?php
/**
 * CSRF Protection — Bunda Jaya Elektronik
 *
 * Alur:
 * - Saat login/check-session, server membuat token acak per sesi dan
 *   mengembalikannya ke frontend.
 * - Frontend mengirim token via header X-CSRF-Token pada setiap
 *   request state-changing (POST/PUT/DELETE).
 * - Endpoint memanggil Csrf::validate() sebelum memproses.
 */

class Csrf
{
    /**
     * Ambil token sesi (buat baru jika belum ada).
     */
    public static function token()
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    /**
     * Validasi token dari header request. Gagal → 403.
     * Tidak dipakai untuk login (sesi belum ada saat itu).
     */
    public static function validate()
    {
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $session = $_SESSION['csrf_token'] ?? '';

        if ($session === '' || $header === '' || !hash_equals($session, $header)) {
            Response::error('CSRF token tidak valid. Muat ulang halaman dan coba lagi.', 403);
        }
    }
}
