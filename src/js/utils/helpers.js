/**
 * Shared frontend helpers — Bunda Jaya Elektronik
 */

/**
 * Escape HTML special chars — cegah Stored XSS saat render data ke innerHTML.
 * Pakai untuk SEMUA data dari server / input user sebelum dimasukkan ke template.
 */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate idempotency key unik per percobaan submit.
 * Dikirim ke backend agar double-click / retry jaringan tidak mencatat ganda.
 */
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'key-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD memakai timezone LOKAL
 * (bukan toISOString yang memakai UTC — bisa mundur 1 hari sebelum jam 07:00 WIB).
 */
export function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Normalisasi angka dari API.
 * PDO MySQL mengembalikan kolom DECIMAL sebagai STRING ("20000000"),
 * sehingga operasi `+` bisa jadi concat bukan penjumlahan.
 * Pakai ini sebelum reduce / aritmatika pada data dari server.
 */
export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format Rupiah terpusat — pengganti `.toLocaleString('id-ID')` mentah
 * yang rusak bila nilainya masih string dari API.
 */
export function formatRupiah(value) {
  return 'Rp ' + num(value).toLocaleString('id-ID');
}
