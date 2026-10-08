# Bunda Jaya Elektronik - API Documentation

Backend REST API untuk Sistem Informasi Toko Elektronik.

## Base URL
```
http://localhost/Bunda%20Jaya%20Elektronik/api
```

## Authentication
Semua endpoint (kecuali login) memerlukan session PHP yang aktif. Session diset saat login berhasil.

**Pengerasan keamanan (2026-10-08):**
- Session cookie: `HttpOnly` + `SameSite=Lax` (+ `Secure` otomatis saat HTTPS) — via `api/utils/Session.php`
- Rate limit login: 5x gagal / 15 menit → kunci 15 menit per IP+username (tabel `login_attempts`, butuh `migrasi-keamanan.sql`)
- Folder `database/` diblokir dari akses web (`.htaccess`)
- Ganti password: `POST /auth.php?action=change-password` (butuh login + CSRF)
- Kelola user (Owner only): `GET/POST/PUT /api/users.php` — tambah user, edit, reset password, nonaktif/aktif (`is_active`, butuh `migrasi-keamanan.sql`)

---

## 🔐 Authentication API

### POST /auth.php?action=login
Login user dan create session.

**Request Body:**
```json
{
  "username": "owner",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "username": "owner",
      "nama": "Owner Toko",
      "role": "Owner"
    },
    "csrf_token": "..."
  }
}
```

### GET /auth.php?action=check
Check apakah session masih aktif.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Session active",
  "data": {
    "user": {...}
  }
}
```

### POST /auth.php?action=logout
Logout dan destroy session.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## 📦 Barang API

### GET /barang.php
Get all barang dengan info kategori & merek.

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode": "HP-IP14PM-256",
      "nama": "iPhone 14 Pro Max 256GB",
      "kategori_id": 1,
      "kategori_nama": "Handphone",
      "merek_id": 1,
      "merek_nama": "Apple",
      "harga_beli": 18200000,
      "harga_jual": 19850000,
      "stok": 5,
      "stok_minimum": 2,
      ...
    }
  ]
}
```

### GET /barang.php?id=1
Get single barang by ID.

### POST /barang.php
Create new barang (Admin/Owner only).

**Request Body:**
```json
{
  "kode": "HP-IP15-128",
  "nama": "iPhone 15 128GB Blue",
  "kategori_id": 1,
  "merek_id": 1,
  "satuan": "Unit",
  "harga_beli": 12000000,
  "harga_jual": 13500000,
  "stok": 10,
  "stok_minimum": 3,
  "deskripsi": "Garansi resmi iBox"
}
```

### PUT /barang.php?id=1
Update barang (Admin/Owner only).

**Request Body:** (fields yang mau diupdate saja)
```json
{
  "harga_jual": 13800000,
  "stok_minimum": 5
}
```

### DELETE /barang.php?id=1
Delete barang (Owner only). Akan gagal jika barang punya transaksi.

---

## 🏷️ Kategori & Merek API

### GET /kategori.php
Get all kategori.

### POST /kategori.php
Create kategori (Admin/Owner only).

```json
{
  "nama": "Smart Home",
  "deskripsi": "Perangkat smart home"
}
```

### GET /merek.php
Get all merek.

### POST /merek.php
Create merek (Admin/Owner only).

```json
{
  "nama": "Xiaomi"
}
```

---

## 🏢 Supplier API

### GET /supplier.php
Get all supplier.

### GET /supplier.php?id=1
Get single supplier.

### POST /supplier.php
Create supplier (Admin/Owner only).

```json
{
  "nama": "PT Supplier ABC",
  "kontak": "08123456789",
  "alamat": "Jl. Contoh No. 123"
}
```

### PUT /supplier.php?id=1
Update supplier.

### DELETE /supplier.php?id=1
Delete supplier (Owner only). Akan gagal jika ada hutang aktif.

---

## 🛒 Transaksi API (POS)

### GET /transaksi.php
Get all transaksi (latest 100).

### GET /transaksi.php?id=1
Get single transaksi with details (items).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nomor": "TRX-20260928-0001",
    "tanggal": "2026-09-28 14:30:00",
    "kasir_nama": "Siti (Kasir)",
    "subtotal": 19850000,
    "diskon_amount": 150000,
    "total": 19700000,
    "metode_bayar": "Transfer",
    "items": [
      {
        "barang_nama": "iPhone 14 Pro Max",
        "jumlah": 1,
        "harga_jual": 19850000,
        "subtotal": 19850000
      }
    ]
  }
}
```

### POST /transaksi.php
Create transaksi (POS Checkout). Akan validasi stok dan kurangi stok otomatis.

**Request Body:**
```json
{
  "items": [
    {
      "barang_id": 1,
      "jumlah": 2
    },
    {
      "barang_id": 3,
      "jumlah": 1
    }
  ],
  "diskon_tipe": "Nominal",
  "diskon_nilai": 100000,
  "diskon_amount": 100000,
  "metode_bayar": "Tunai",
  "jumlah_bayar": 5000000
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Transaksi berhasil disimpan",
  "data": {
    "id": 45,
    "nomor": "TRX-20260928-0045",
    "total": 4900000,
    "kembalian": 100000
  }
}
```

### GET /transaksi.php?action=history&date_from=2026-09-01&date_to=2026-09-30
Get transaction history with filters.

**Query Parameters:**
- `date_from` (optional)
- `date_to` (optional)
- `kasir_id` (optional)
- `metode_bayar` (optional)

---

## 📥 Pembelian API (Stok Masuk)

### GET /pembelian.php
Get all pembelian (latest 200).

### GET /pembelian.php?id=1
Get single pembelian with details.

### POST /pembelian.php
Create pembelian (Admin/Owner only). Akan tambah stok otomatis dan create hutang jika status_bayar = 'Hutang'.

**Request Body:**
```json
{
  "supplier_id": 1,
  "tanggal": "2026-09-28",
  "status_bayar": "Hutang",
  "jatuh_tempo": "2026-10-28",
  "items": [
    {
      "barang_id": 2,
      "jumlah": 5,
      "harga_beli": 17500000
    },
    {
      "barang_id": 3,
      "jumlah": 3,
      "harga_beli": 4100000
    }
  ]
}
```

**Note:** Jika `status_bayar` = "Lunas", wajib sertakan `metode_bayar`.

---

## 💳 Hutang API

### GET /hutang.php
Get all active hutang (Belum Lunas).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "supplier_nama": "PT Samsung",
      "pembelian_nomor": "BUY-20260920-0001",
      "total_hutang": 35000000,
      "sudah_dibayar": 15000000,
      "sisa_hutang": 20000000,
      "jatuh_tempo": "2026-09-26",
      "status_tempo": "Terlambat"
    }
  ]
}
```

### GET /hutang.php?id=1
Get single hutang detail with payment history.

### POST /hutang.php?action=bayar
Pay hutang (cicilan atau lunas).

**Request Body:**
```json
{
  "hutang_id": 1,
  "jumlah_bayar": 5000000,
  "metode_bayar": "Transfer",
  "tanggal_bayar": "2026-09-28"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Pembayaran hutang berhasil disimpan",
  "data": {
    "hutang_id": 1,
    "sudah_dibayar": 20000000,
    "sisa_hutang": 15000000,
    "status": "Belum Lunas"
  }
}
```

---

## 📊 Dashboard & Laporan API

### GET /dashboard.php?action=metrics
Dashboard metrics (today).

**Response:**
```json
{
  "success": true,
  "data": {
    "total_transaksi": 15,
    "total_omzet": 58000000,
    "laba_kotor": 4500000,
    "stok_menipis_count": 3,
    "top_products": [...],
    "low_stock_items": [...],
    "active_debts": [...]
  }
}
```

### GET /dashboard.php?action=chart-7hari
Chart data untuk 7 hari terakhir.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-09-22",
      "label": "Sen, 22 Sep",
      "count": 8,
      "omzet": 12500000
    },
    ...
  ]
}
```

### GET /dashboard.php?action=penjualan-harian&tanggal=2026-09-28
Laporan penjualan harian.

**Response:**
```json
{
  "success": true,
  "data": {
    "tanggal": "2026-09-28",
    "summary": {
      "total_transaksi": 15,
      "total_pendapatan": 58000000,
      "tunai": 25000000,
      "transfer": 20000000,
      "kartu": 8000000,
      "qris": 5000000,
      "total_hpp": 53500000,
      "laba_kotor": 4500000
    },
    "transactions": [...]
  }
}
```

### GET /dashboard.php?action=terlaris&date_from=2026-09-01&date_to=2026-09-30
Laporan barang terlaris.

### GET /dashboard.php?action=stok-menipis
Laporan barang stok menipis (stok <= stok_minimum).

### GET /dashboard.php?action=kas-harian&tanggal=2026-09-28
Laporan kas harian (kas masuk/keluar).

**Response:**
```json
{
  "success": true,
  "data": {
    "tanggal": "2026-09-28",
    "saldo_awal": 5000000,
    "kas_masuk": 25000000,
    "kas_keluar": 3000000,
    "saldo_akhir": 27000000,
    "detail_kas_masuk": [...]
  }
}
```

---

## Error Response Format

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "kode": "Field kode is required"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Silakan login terlebih dahulu"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Akses ditolak. Hanya Admin/Owner yang dapat mengakses."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| owner | password123 | Owner |
| admin | password123 | Admin |

⚠️ **PENTING:** Ganti password setelah login pertama!

---

## Testing API

### Menggunakan cURL (PowerShell):

**Login:**
```powershell
Invoke-RestMethod -Uri "http://localhost/Bunda%20Jaya%20Elektronik/api/auth.php?action=login" -Method POST -Body '{"username":"owner","password":"password123"}' -ContentType "application/json" -SessionVariable session
```

**Get Barang (dengan session):**
```powershell
Invoke-RestMethod -Uri "http://localhost/Bunda%20Jaya%20Elektronik/api/barang.php" -Method GET -WebSession $session
```

### Menggunakan Postman/Insomnia:
1. Buat collection baru
2. Set Base URL: `http://localhost/Bunda%20Jaya%20Elektronik/api`
3. Login dulu untuk dapat session cookie
4. Cookie akan otomatis tersimpan untuk request berikutnya

---

## Database Transaction Safety

API ini menggunakan **database transaction** untuk operasi kritis:
- **Transaksi POS**: Jika gagal, stok tidak berkurang (rollback otomatis)
- **Pembelian**: Jika gagal, stok tidak bertambah dan hutang tidak tercatat
- **Pembayaran Hutang**: Atomic update hutang

---

## Development Notes

- Error log ditulis ke PHP error log (cek `C:\laragon\bin\php\php-x.x.x\error.log`)
- Session timeout default: 1440 detik (24 menit)
- CORS diaktifkan untuk development (tighten untuk production)
- Password saat ini plain text di database (gunakan bcrypt untuk production!)

---

**Last Updated:** 28 September 2026
