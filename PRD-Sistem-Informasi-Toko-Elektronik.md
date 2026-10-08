# PRD: Sistem Informasi Toko Elektronik

**Versi:** 1.0  
**Tanggal:** 28 September 2026  
**Product Manager:** Senior PM  
**Produk:** Aplikasi Web Internal untuk Operasional Toko Ritel Elektronik

> **Catatan keputusan bisnis (8 Okt 2026):**
> - Role sistem **Kasir dinonaktifkan** — operator kasir merangkap admin, cukup pakai akun **Admin**. (Istilah "kasir" di dokumen ini merujuk ke fungsi/pekerjaan, bukan role sistem.)
> - **Admin boleh mengubah harga jual** — owner hanya memonitor via laporan.
> - **Metode pembayaran: Tunai, Transfer, QRIS** (Kartu dihapus — tidak ada mesin EDC).
> - **Jatuh tempo hutang** tidak wajib H+1.
> - **Laporan kas = arus kas murni harian** (masuk − keluar), tanpa saldo awal fiktif.

---

## 1. Problem Statement

**Siapa yang dirugikan:**
- **Owner toko elektronik** kehilangan uang karena stok tidak akurat menyebabkan overstock (modal mati) atau kehabisan stok (kehilangan penjualan). Laporan penjualan dan laba lambat dibuat sehingga keputusan bisnis terlambat.
- **Kasir/Staff** membuang waktu mencatat transaksi manual di buku/Excel, hitung total/kembalian manual, dan sering salah hitung. Tidak ada validasi stok saat jual barang.
- **Pelanggan** mengalami harga tidak konsisten (kasir bingung harga jual) dan menunggu lama karena proses kasir lambat.

**Kenapa:**
Pencatatan manual (buku/Excel) tidak terintegrasi. Stok masuk dicatat terpisah dari penjualan. Harga jual berubah-ubah tanpa master data. Histori transaksi hilang atau susah dicari. Owner harus merekap manual setiap malam untuk tahu untung/rugi.

**Dampak bisnis:**
- Modal terbuang di barang yang tidak laku
- Kehilangan penjualan karena stok kosong padahal kasir tidak tahu
- Margin tidak terkontrol (sering jual rugi tanpa sadar)
- Tidak bisa lacak barang mana yang paling laris
- Keputusan restock terlambat

---

## 2. Target User & Persona

### Target User
1. **Owner** (1 orang) — pengambil keputusan, butuh laporan laba/rugi, stok, dan performa penjualan
2. **Kasir** (1 orang, bisa owner sendiri atau staff) — input transaksi penjualan setiap hari
3. **Admin** (1 orang, bisa owner atau staff) — kelola master data barang, supplier, stok masuk

### Persona 1: **Budi (Owner, 45 tahun)**
- **Latar belakang:** Pemilik toko elektronik "Bunda Jaya Elektronik" sejak 15 tahun. Sarjana ekonomi, tidak terlalu paham IT tapi bisa pakai Excel dan WhatsApp Web.
- **Kebiasaan:** Setiap malam hitung kas manual, catat di buku besar. Setiap akhir bulan rekap Excel untuk laporan pajak. Sering panik karena tidak tahu stok real-time.
- **Pain points:** 
  - Tidak tahu barang mana yang untung besar
  - Sering kehabisan stok HP bestseller tapi overstock aksesoris yang tidak laku
  - Kasir sering salah hitung kembalian atau salah input harga
  - Laporan bulanan butuh 2 hari untuk rekap manual
- **Goals:** Tahu laba kotor harian setiap malam sebelum pulang. Stok selalu akurat. Bisa cek barang terlaris untuk restock cerdas.
- **Quote:** *"Saya mau tahu hari ini untung berapa, tanpa harus hitung-hitung manual sampai jam 10 malam."*

### Persona 2: **Siti (Kasir/Admin, 28 tahun)**
- **Latar belakang:** Karyawan toko, lulusan SMK, kerja 2 tahun. Paham komputer dasar (Windows, browser, Excel).
- **Kebiasaan:** Datang jam 9 pagi, buka toko, layani pembeli sampai jam 9 malam. Catat penjualan di buku besar manual. Kalau ada barang masuk dari supplier, tulis di buku stok terpisah.
- **Pain points:**
  - Harus cek buku stok manual setiap kali pembeli tanya "masih ada stok?"
  - Sering lupa harga jual (harus telpon owner atau tebak)
  - Hitung total belanjaan dan kembalian manual, sering salah
  - Capek tulis ulang transaksi dari buku ke Excel untuk laporan owner
- **Goals:** Transaksi cepat (pilih barang, input jumlah, langsung total). Stok otomatis update. Tidak perlu hafal harga (sistem tahu harga jual). Cetak/simpan struk untuk pelanggan.
- **Quote:** *"Saya mau sistem yang cepat, tinggal klik-klik, total keluar, selesai. Gak usah ribet hitung manual."*

---

## 3. Goals dan Non-Goals

### Goals
1. **Stok selalu akurat real-time** — setiap penjualan atau pembelian langsung update stok, owner/kasir bisa cek stok kapan saja
2. **Transaksi kasir cepat dan akurat** — kasir input barang, sistem hitung total otomatis, tidak ada salah hitung
3. **Laporan owner cepat tersedia** — owner bisa lihat laba kotor harian, barang terlaris, stok menipis tanpa rekap manual
4. **Harga jual konsisten** — semua barang punya harga jual di master data, kasir tidak bisa asal input
5. **Histori transaksi lengkap** — semua penjualan dan pembelian tercatat permanen, bisa dicari kapan saja

### Non-Goals
1. **Bukan e-commerce** — tidak ada katalog online untuk pembeli retail, tidak ada checkout online, tidak ada integrasi marketplace
2. **Bukan aplikasi mobile** — web saja, akses via browser (Chrome/Edge), tidak perlu aplikasi Android/iOS
3. **Bukan sistem multi-cabang** — satu toko saja, tidak perlu sinkronisasi antar cabang
4. **Bukan mode offline-first** — sistem butuh localhost (Laragon) jalan, tidak perlu jalan tanpa server
5. **Bukan integrasi payment gateway** — tidak perlu integrasi QRIS otomatis atau EDC online, cukup catat metode bayar manual
6. **Bukan integrasi perpajakan otomatis** — tidak perlu otomatis lapor pajak atau e-Faktur, cukup laporan untuk input manual nanti

---

## 4. User Stories

### Owner
1. Sebagai **Owner**, saya ingin **melihat laporan penjualan harian (tanggal, total transaksi, total pendapatan, laba kotor)** supaya **saya tahu performa toko hari ini sebelum pulang**
2. Sebagai **Owner**, saya ingin **melihat daftar 10 barang terlaris bulan ini (berdasarkan kuantitas atau revenue)** supaya **saya tahu barang mana yang harus di-restock prioritas**
3. Sebagai **Owner**, saya ingin **melihat daftar barang yang stoknya di bawah batas minimum (peringatan stok menipis)** supaya **saya bisa order ke supplier sebelum kehabisan**
4. Sebagai **Owner**, saya ingin **melihat laporan laba kotor per kategori atau merek** supaya **saya tahu produk mana yang margin-nya paling bagus**
5. Sebagai **Owner**, saya ingin **melihat total kas (saldo awal + penjualan tunai - pembelian tunai)** supaya **saya bisa rekonsiliasi kas fisik setiap hari**
6. Sebagai **Owner**, saya ingin **melihat laporan hutang ke supplier (supplier mana, berapa sisa hutang, jatuh tempo kapan)** supaya **saya tidak telat bayar dan hubungan supplier tetap baik**

### Kasir
1. Sebagai **Kasir**, saya ingin **memilih barang dari daftar (atau cari nama/kode barang)** supaya **saya tidak perlu hafal semua barang dan harga**
2. Sebagai **Kasir**, saya ingin **menambahkan barang ke keranjang, ubah jumlah, hapus item** supaya **saya bisa koreksi kalau pembeli berubah pikiran**
3. Sebagai **Kasir**, saya ingin **sistem otomatis hitung total + diskon (jika ada)** supaya **saya tidak salah hitung**
4. Sebagai **Kasir**, saya ingin **input metode bayar (tunai/transfer/kartu/QRIS) dan jumlah bayar, sistem hitung kembalian** supaya **saya tidak salah kembalian**
5. Sebagai **Kasir**, saya ingin **cetak struk transaksi (atau simpan PDF)** supaya **pembeli punya bukti bayar dan saya punya arsip**
6. Sebagai **Kasir**, saya ingin **sistem warning kalau stok barang tidak cukup saat input ke keranjang** supaya **saya tidak jual barang yang stoknya kosong**
7. Sebagai **Kasir**, saya ingin **melihat histori transaksi hari ini** supaya **kalau pembeli komplain saya bisa cek kembali**

### Admin
1. Sebagai **Admin**, saya ingin **menambah barang baru (nama, kode, kategori, merek, harga beli, harga jual, stok awal, batas stok minimum)** supaya **barang baru bisa langsung dijual**
2. Sebagai **Admin**, saya ingin **edit data barang (terutama harga jual dan batas stok minimum)** supaya **harga selalu update dan peringatan stok akurat**
3. Sebagai **Admin**, saya ingin **mencatat pembelian barang dari supplier (supplier, barang, jumlah, harga beli, total, status bayar: lunas/hutang)** supaya **stok bertambah otomatis dan hutang tercatat**
4. Sebagai **Admin**, saya ingin **mencatat pembayaran hutang ke supplier** supaya **sisa hutang berkurang dan laporan hutang akurat**
5. Sebagai **Admin**, saya ingin **mencatat retur penjualan dari pelanggan (transaksi mana, barang apa, jumlah, alasan)** supaya **stok kembali dan kas/piutang disesuaikan**
6. Sebagai **Admin**, saya ingin **mencatat retur pembelian ke supplier (pembelian mana, barang apa, jumlah, alasan)** supaya **stok berkurang dan hutang/kas disesuaikan**
7. Sebagai **Admin**, saya ingin **melakukan stok opname (hitung fisik vs sistem, catat selisih, update stok sistem)** supaya **stok sistem sesuai realita di gudang**

---

## 5. Daftar Fitur: MVP / V2 / Nanti

### MVP (Must-Have untuk Go-Live)
**Target:** Kasir bisa transaksi, stok otomatis berkurang, owner bisa lihat laporan harian.

1. **Autentikasi & Otorisasi**
   - Login user (username/password)
   - Role: Owner, Admin, Kasir
   - Logout

2. **Master Data Barang**
   - CRUD barang (kode, nama, kategori, merek, satuan, harga beli, harga jual, stok, stok minimum)
   - CRUD kategori
   - CRUD merek

3. **Master Data Supplier**
   - CRUD supplier (nama, kontak, alamat)

4. **Stok Masuk (Pembelian)**
   - Catat pembelian dari supplier (tanggal, supplier, list barang + jumlah + harga beli, total, status bayar: lunas/hutang, jatuh tempo hutang)
   - Stok barang otomatis bertambah
   - Hutang supplier tercatat jika belum lunas

5. **Transaksi Kasir (POS)**
   - Pilih barang → tambah ke keranjang (barang, jumlah, harga jual, subtotal)
   - Validasi stok tersedia (warning jika stok < jumlah jual)
   - Hitung total keranjang
   - Input diskon (nominal atau persen, opsional)
   - Input metode bayar (tunai/transfer/kartu/QRIS) + jumlah bayar
   - Hitung kembalian (jika tunai)
   - Simpan transaksi → stok otomatis berkurang
   - Cetak/view struk (nomor transaksi, tanggal, kasir, list barang, total, bayar, kembalian)

6. **Laporan Owner**
   - Laporan penjualan harian (tanggal, jumlah transaksi, total pendapatan, total laba kotor)
   - Laporan barang terlaris (top 10 berdasarkan kuantitas atau revenue, periode tertentu)
   - Laporan stok menipis (barang yang stok <= stok minimum)
   - Laporan kas harian (saldo awal + penjualan tunai - pembelian tunai)

7. **Manajemen Hutang Supplier**
   - Daftar hutang supplier (supplier, nomor pembelian, total hutang, sisa hutang, jatuh tempo)
   - Catat pembayaran hutang (hutang mana, tanggal bayar, jumlah bayar) → sisa hutang berkurang

8. **Dashboard**
   - Ringkasan hari ini: jumlah transaksi, total penjualan, laba kotor, stok menipis
   - Chart sederhana (opsional): penjualan 7 hari terakhir

### V2 (Next Priority, Post-MVP)

1. **Master Data Pelanggan**
   - CRUD pelanggan (nama, kontak, alamat)
   - Link transaksi ke pelanggan (opsional)

2. **Retur Penjualan**
   - Catat retur dari pelanggan (transaksi asal, barang, jumlah, alasan)
   - Stok barang kembali
   - Kas berkurang (jika refund tunai) atau piutang (jika kredit)

3. **Retur Pembelian**
   - Catat retur ke supplier (pembelian asal, barang, jumlah, alasan)
   - Stok barang berkurang
   - Hutang berkurang atau kas kembali

4. **Stok Opname**
   - Input stok fisik per barang
   - Bandingkan dengan stok sistem
   - Catat selisih (lebih/kurang) + alasan
   - Update stok sistem sesuai fisik

5. **Laporan Lanjutan**
   - Laporan laba per kategori/merek
   - Laporan pembelian (supplier, periode, total)
   - Laporan retur (penjualan dan pembelian)
   - Laporan stok opname

6. **Diskon Lanjutan**
   - Diskon per item (bukan hanya total transaksi)
   - Promo otomatis (misal beli 2 gratis 1) → untuk versi jauh

7. **Printer Thermal Support**
   - Format struk untuk printer thermal (58mm atau 80mm)

### Nanti (Nice-to-Have, Low Priority)

1. **Barcode Scanner Support**
   - Input barang via scan barcode (bukan manual search)

2. **Multi-User Concurrent**
   - Beberapa kasir kerja bersamaan (lock stok, queue transaksi)

3. **Notifikasi**
   - Email/WhatsApp owner jika stok menipis atau hutang jatuh tempo

4. **Ekspor Laporan**
   - Download laporan ke Excel/PDF

5. **Akuntansi Penuh**
   - Jurnal umum, buku besar, neraca, laporan laba rugi (akuntansi double-entry)

6. **Multi-Cabang**
   - Kelola beberapa toko dari satu sistem

---

## 6. Functional Requirement Detail (MVP)

### 6.1. Autentikasi & Otorisasi

**Aktor:** Semua user  
**Trigger:** User buka aplikasi  

**Alur:**
1. User membuka aplikasi → muncul halaman login
2. User input username dan password
3. Sistem validasi credentials
4. Jika valid → redirect ke dashboard sesuai role
5. Jika tidak valid → tampilkan error "Username atau password salah"

**Input:**
- Username (text, required, max 50 karakter)
- Password (text, required, min 6 karakter)

**Output:**
- Session login (cookie/token)
- Redirect ke dashboard

**Validasi:**
- Username dan password tidak boleh kosong
- Username harus terdaftar di database
- Password harus cocok (hash)

**Error State:**
- Username tidak ditemukan → "Username tidak terdaftar"
- Password salah → "Password salah"
- User sudah login di device lain → izinkan (multi-session OK untuk MVP, bisa dibatasi di V2)

**Role & Permission:**
- **Owner:** Akses semua fitur (master data, transaksi, laporan, hutang, user management)
- **Admin:** Akses master data, pembelian, stok, hutang (tidak bisa hapus user atau edit harga jual tanpa approval)
- **Kasir:** Akses transaksi POS, lihat stok, lihat histori transaksi sendiri (tidak bisa akses laporan owner atau edit master data)

**Logout:**
- Button logout di header/sidebar
- Clear session → redirect ke login

---

### 6.2. Master Data Barang

**Aktor:** Admin, Owner  
**Trigger:** Admin buka menu "Master Data Barang"

#### 6.2.1. Tambah Barang Baru

**Alur:**
1. Admin klik "Tambah Barang"
2. Form input muncul
3. Admin isi semua field
4. Klik "Simpan"
5. Sistem validasi input
6. Jika valid → simpan ke database → tampilkan pesan sukses → redirect ke daftar barang
7. Jika tidak valid → tampilkan error di bawah field yang salah

**Input:**
- Kode Barang (text, required, unique, max 20 karakter, contoh: "HP-IP14PM-256-BL")
- Nama Barang (text, required, max 200 karakter, contoh: "iPhone 14 Pro Max 256GB Black")
- Kategori (dropdown, required, pilih dari master kategori, contoh: "Handphone")
- Merek (dropdown, required, pilih dari master merek, contoh: "Apple")
- Satuan (dropdown, required, pilih: "Unit", "Pcs", "Set", default: "Unit")
- Harga Beli (number, required, min 0, contoh: 18000000)
- Harga Jual (number, required, min harga beli, contoh: 19500000)
- Stok Awal (number, required, min 0, default: 0, contoh: 5)
- Stok Minimum (number, required, min 0, default: 1, contoh: 2, untuk peringatan stok menipis)
- Deskripsi (textarea, optional, max 500 karakter)

**Output:**
- Data barang tersimpan di tabel `barang`
- Pesan sukses: "Barang [Nama Barang] berhasil ditambahkan"

**Validasi:**
- Kode barang tidak boleh duplikat → error: "Kode barang sudah digunakan"
- Harga jual harus >= harga beli → error: "Harga jual tidak boleh lebih rendah dari harga beli"
- Semua field required harus diisi → error: "Field [nama field] wajib diisi"

**Error State:**
- Koneksi database gagal → "Gagal menyimpan data, coba lagi"
- Kategori/merek belum ada → tampilkan link "Tambah Kategori/Merek Baru" di form

#### 6.2.2. Edit Barang

**Alur:**
1. Admin klik "Edit" di daftar barang
2. Form edit muncul, pre-filled dengan data barang
3. Admin ubah field yang perlu diubah (terutama harga jual, stok minimum)
4. Klik "Simpan"
5. Sistem validasi input
6. Jika valid → update database → pesan sukses
7. Jika tidak valid → tampilkan error

**Input:** Sama seperti tambah barang, kecuali:
- Kode barang tidak bisa diubah (readonly)
- Stok tidak bisa diubah manual di sini (ubah via stok opname atau pembelian/penjualan)

**Output:**
- Data barang ter-update
- Pesan sukses: "Barang [Nama Barang] berhasil diupdate"

**Validasi:** Sama seperti tambah barang

**Edge Case:**
- Barang sudah ada transaksi (penjualan/pembelian) → tetap bisa edit harga jual (harga baru berlaku untuk transaksi berikutnya, histori transaksi pakai harga lama)

#### 6.2.3. Hapus Barang

**Alur:**
1. Admin klik "Hapus" di daftar barang
2. Muncul konfirmasi: "Yakin hapus barang [Nama Barang]? Data tidak bisa dikembalikan."
3. Jika Ya → sistem cek apakah barang pernah ada transaksi
4. Jika tidak ada transaksi → hapus dari database → pesan sukses
5. Jika ada transaksi → error: "Barang tidak bisa dihapus karena sudah ada transaksi. Gunakan fitur non-aktifkan barang (V2)."

**Output:**
- Barang terhapus dari database (jika belum ada transaksi)
- Pesan sukses: "Barang [Nama Barang] berhasil dihapus"

**Error State:**
- Barang sudah ada transaksi → "Barang tidak bisa dihapus karena sudah ada transaksi"

#### 6.2.4. Daftar Barang

**Alur:**
1. Admin buka menu "Master Data Barang"
2. Sistem tampilkan tabel daftar barang (semua barang, sortir nama A-Z default)
3. Admin bisa search (nama/kode), filter (kategori/merek), sortir (nama/stok/harga)

**Output:**
- Tabel kolom: Kode, Nama, Kategori, Merek, Harga Jual, Stok, Aksi (Edit, Hapus)
- Pagination (50 item per halaman default)

**Fitur:**
- Search real-time (nama atau kode barang)
- Filter dropdown (kategori, merek)
- Sortir kolom (ascending/descending)
- Highlight barang stok <= stok minimum (background merah muda)

---

### 6.3. Master Data Kategori

**Aktor:** Admin, Owner  
**Alur:** CRUD sederhana (nama kategori, deskripsi)

**Field:**
- ID Kategori (auto-increment)
- Nama Kategori (text, required, unique, max 100 karakter, contoh: "Handphone", "Laptop", "TV", "AC", "Aksesoris", "Spare Part")
- Deskripsi (text, optional, max 200 karakter)

**Validasi:**
- Nama kategori tidak boleh duplikat
- Kategori tidak bisa dihapus jika ada barang yang pakai kategori ini → error: "Kategori tidak bisa dihapus karena masih ada barang yang menggunakannya"

---

### 6.4. Master Data Merek

**Aktor:** Admin, Owner  
**Alur:** CRUD sederhana (nama merek)

**Field:**
- ID Merek (auto-increment)
- Nama Merek (text, required, unique, max 100 karakter, contoh: "Apple", "Samsung", "LG", "Sony", "Polytron", "Panasonic")

**Validasi:**
- Nama merek tidak boleh duplikat
- Merek tidak bisa dihapus jika ada barang yang pakai merek ini

---

### 6.5. Master Data Supplier

**Aktor:** Admin, Owner  
**Trigger:** Admin buka menu "Master Data Supplier"

**Field:**
- ID Supplier (auto-increment)
- Nama Supplier (text, required, max 200 karakter, contoh: "PT Maju Jaya Elektronik")
- Kontak (text, optional, max 50 karakter, contoh: "08123456789")
- Alamat (textarea, optional, max 500 karakter)

**Alur:** CRUD sederhana (tambah, edit, hapus, daftar)

**Validasi:**
- Nama supplier tidak boleh duplikat
- Supplier tidak bisa dihapus jika ada pembelian atau hutang aktif → error: "Supplier tidak bisa dihapus karena masih ada hutang atau histori pembelian"

---

### 6.6. Stok Masuk (Pembelian dari Supplier)

**Aktor:** Admin, Owner  
**Trigger:** Admin buka menu "Pembelian" → klik "Tambah Pembelian"

#### 6.6.1. Catat Pembelian Baru

**Alur:**
1. Admin klik "Tambah Pembelian"
2. Form pembelian muncul
3. Admin pilih supplier (dropdown)
4. Admin pilih tanggal pembelian (date picker, default hari ini)
5. Admin tambah barang ke list pembelian:
   - Pilih barang (dropdown/search)
   - Input jumlah (number)
   - Input harga beli per unit (number, default dari master barang, bisa diubah)
   - Subtotal otomatis = jumlah × harga beli
6. Admin bisa tambah banyak barang (klik "Tambah Barang Lagi")
7. Total pembelian otomatis = sum(subtotal semua barang)
8. Admin pilih status bayar:
   - **Lunas** → input metode bayar (tunai/transfer/kartu), tanggal bayar = tanggal pembelian
   - **Hutang** → input jatuh tempo hutang (date, required)
9. Admin klik "Simpan"
10. Sistem validasi input
11. Jika valid → simpan pembelian ke database → update stok barang (stok bertambah) → jika hutang, catat di tabel hutang_supplier → pesan sukses
12. Jika tidak valid → tampilkan error

**Input:**
- Tanggal Pembelian (date, required, default hari ini, tidak boleh tanggal masa depan)
- Supplier (dropdown, required)
- List Barang:
  - Barang (dropdown/search, required)
  - Jumlah (number, required, min 1)
  - Harga Beli per Unit (number, required, min 0)
  - Subtotal (readonly, auto-calculate)
- Total Pembelian (readonly, auto-calculate)
- Status Bayar (radio button, required, pilih: "Lunas" atau "Hutang")
- Jika Lunas:
  - Metode Bayar (dropdown, required, pilih: "Tunai", "Transfer", "Kartu")
- Jika Hutang:
  - Jatuh Tempo (date, required, harus tanggal masa depan)

**Output:**
- Data pembelian tersimpan di tabel `pembelian` (header)
- Data detail pembelian tersimpan di tabel `pembelian_detail` (per barang)
- Stok barang di tabel `barang` bertambah sesuai jumlah pembelian
- Jika hutang → data hutang tersimpan di tabel `hutang_supplier`
- Jika lunas → kas berkurang (dicatat di laporan kas)
- Pesan sukses: "Pembelian dari [Nama Supplier] berhasil disimpan. Stok barang sudah diupdate."

**Validasi:**
- Supplier harus dipilih
- Minimal 1 barang dalam list pembelian
- Jumlah barang harus > 0
- Harga beli harus >= 0
- Jika hutang, jatuh tempo harus tanggal masa depan (>= hari ini + 1 hari)
- Tanggal pembelian tidak boleh tanggal masa depan

**Error State:**
- Supplier belum dipilih → "Pilih supplier terlebih dahulu"
- List barang kosong → "Tambahkan minimal 1 barang"
- Jatuh tempo hutang salah → "Jatuh tempo harus tanggal masa depan"
- Koneksi database gagal → "Gagal menyimpan pembelian, coba lagi"

**Edge Case:**
- Admin input harga beli berbeda dari master barang → izinkan (harga beli bisa nego/promo), harga di transaksi ini pakai harga input, master barang tidak berubah
- Barang yang sama dibeli 2 kali dalam 1 pembelian → izinkan (misal beda batch/harga), stok tetap bertambah total

#### 6.6.2. Daftar Pembelian

**Alur:**
1. Admin buka menu "Pembelian"
2. Sistem tampilkan tabel daftar pembelian (sortir tanggal terbaru dulu)
3. Admin bisa search (nomor pembelian/supplier), filter (tanggal, status bayar)

**Output:**
- Tabel kolom: Nomor Pembelian, Tanggal, Supplier, Total, Status Bayar, Aksi (Lihat Detail)
- Pagination (50 item per halaman)

**Fitur:**
- Search supplier
- Filter tanggal (dari-sampai)
- Filter status bayar (semua/lunas/hutang)
- Klik "Lihat Detail" → muncul modal/halaman detail pembelian (list barang, jumlah, harga, total)

---

### 6.7. Transaksi Kasir (POS)

**Aktor:** Kasir, Admin, Owner  
**Trigger:** Kasir buka menu "Transaksi Kasir" atau "POS"

#### 6.7.1. Proses Transaksi Penjualan

**Alur:**
1. Kasir buka halaman POS
2. Halaman menampilkan:
   - Form pilih barang (search/dropdown)
   - Keranjang (list barang yang sudah ditambahkan)
   - Total keranjang (readonly)
   - Form diskon, metode bayar, jumlah bayar, kembalian
3. Kasir search/pilih barang → pilih barang dari hasil search
4. Input jumlah barang → klik "Tambah ke Keranjang"
5. Sistem validasi stok:
   - Jika stok >= jumlah → tambahkan ke keranjang
   - Jika stok < jumlah → warning: "Stok tidak cukup. Stok tersedia: [X] unit"
6. Keranjang update real-time:
   - Tampilkan list barang (nama, harga satuan, jumlah, subtotal)
   - Button "Ubah Jumlah" dan "Hapus" per item
7. Total keranjang otomatis = sum(subtotal semua item)
8. Kasir bisa tambah barang lagi (ulangi langkah 3-6)
9. Setelah semua barang di keranjang, kasir input diskon (opsional):
   - Pilih tipe diskon: "Nominal" atau "Persen"
   - Input nilai diskon
   - Total setelah diskon = total keranjang - diskon
10. Kasir pilih metode bayar (dropdown: Tunai/Transfer/Kartu/QRIS)
11. Kasir input jumlah bayar (number)
12. Sistem hitung kembalian (readonly):
    - Jika metode bayar = Tunai → kembalian = jumlah bayar - total setelah diskon
    - Jika metode bayar ≠ Tunai → kembalian = 0 (asumsi bayar pas)
13. Kasir klik "Proses Transaksi"
14. Sistem validasi input
15. Jika valid → simpan transaksi ke database → kurangi stok semua barang di keranjang → tampilkan struk → clear keranjang → pesan sukses
16. Jika tidak valid → tampilkan error

**Input:**
- Barang (search/dropdown, required)
- Jumlah (number, required, min 1)
- Diskon:
  - Tipe Diskon (dropdown, optional, pilih: "Nominal" atau "Persen")
  - Nilai Diskon (number, optional, min 0)
- Metode Bayar (dropdown, required, pilih: "Tunai", "Transfer", "Kartu", "QRIS")
- Jumlah Bayar (number, required, min total setelah diskon)

**Output:**
- Data transaksi tersimpan di tabel `transaksi` (header)
- Data detail transaksi tersimpan di tabel `transaksi_detail` (per barang)
- Stok barang di tabel `barang` berkurang sesuai jumlah jual
- Struk transaksi ditampilkan (bisa print atau simpan PDF)
- Pesan sukses: "Transaksi berhasil. Klik 'Cetak Struk' untuk cetak bukti."

**Validasi:**
- Keranjang tidak boleh kosong → error: "Keranjang kosong, tambahkan barang terlebih dahulu"
- Stok barang harus >= jumlah jual → error: "Stok [Nama Barang] tidak cukup"
- Jumlah bayar harus >= total setelah diskon → error: "Jumlah bayar kurang. Total: Rp [X], Bayar: Rp [Y]"
- Diskon tidak boleh > total keranjang → error: "Diskon terlalu besar"
- Jika diskon persen, nilai harus 0-100 → error: "Diskon persen harus 0-100"

**Error State:**
- Stok tidak cukup saat tambah ke keranjang → warning, tidak bisa tambah, kasir harus kurangi jumlah atau pilih barang lain
- Stok berubah (user lain checkout barang yang sama) sebelum transaksi selesai → saat proses transaksi, cek ulang stok, jika tidak cukup → error: "Stok [Nama Barang] sudah habis, silakan kurangi jumlah atau batalkan item"
- Koneksi database gagal saat simpan transaksi → error: "Gagal menyimpan transaksi, coba lagi. Transaksi BELUM tersimpan."

**Edge Case:**
- Kembalian negatif (jumlah bayar < total) → tidak boleh proses, tampilkan error validasi
- Diskon 100% (gratis) → izinkan (misal promo/hadiah), total setelah diskon = 0, jumlah bayar minimal 0
- Barang yang sama ditambahkan 2 kali ke keranjang → gabungkan (jumlah bertambah), bukan item terpisah

#### 6.7.2. Struk Transaksi

**Format Struk:**
```
========================================
       TOKO BUNDA JAYA ELEKTRONIK
   Jl. Contoh No. 123, Kota, Provinsi
           Telp: 08123456789
========================================
Nomor Transaksi: TRX-20260928-0001
Tanggal        : 28 Sep 2026 14:35
Kasir          : Siti
========================================
[Nama Barang 1]
  [Jumlah] x Rp [Harga Satuan]
                      Rp [Subtotal]
[Nama Barang 2]
  [Jumlah] x Rp [Harga Satuan]
                      Rp [Subtotal]
----------------------------------------
Subtotal             Rp [Total Keranjang]
Diskon ([X]%)        Rp [Diskon]
----------------------------------------
TOTAL                Rp [Total Setelah Diskon]
========================================
Metode Bayar         : [Tunai/Transfer/Kartu/QRIS]
Jumlah Bayar         : Rp [Jumlah Bayar]
Kembalian            : Rp [Kembalian]
========================================
    Terima kasih atas kunjungan Anda!
       Barang yang sudah dibeli
         tidak dapat dikembalikan
           (kecuali ada kesepakatan)
========================================
```

**Output Struk:**
- Tampilkan di modal/halaman baru
- Button "Cetak" (window.print() untuk print via browser)
- Button "Simpan PDF" (opsional, untuk MVP bisa print to PDF via browser)
- Button "Kembali ke POS"

#### 6.7.3. Histori Transaksi

**Aktor:** Kasir (lihat transaksi sendiri), Admin/Owner (lihat semua transaksi)  
**Alur:**
1. User buka menu "Histori Transaksi"
2. Sistem tampilkan tabel transaksi (sortir tanggal terbaru dulu)
3. User bisa search (nomor transaksi), filter (tanggal, kasir, metode bayar)

**Output:**
- Tabel kolom: Nomor Transaksi, Tanggal, Kasir, Total, Metode Bayar, Aksi (Lihat Detail, Cetak Ulang Struk)
- Pagination (50 item per halaman)

**Fitur:**
- Search nomor transaksi
- Filter tanggal (dari-sampai)
- Filter kasir (dropdown, admin/owner bisa lihat semua, kasir hanya lihat transaksi sendiri)
- Filter metode bayar (dropdown)
- Klik "Lihat Detail" → muncul modal detail transaksi (list barang, jumlah, harga, total, diskon, bayar, kembalian)
- Klik "Cetak Ulang Struk" → tampilkan struk lagi

---

### 6.8. Laporan Owner

**Aktor:** Owner, Admin  
**Trigger:** Owner buka menu "Laporan"

#### 6.8.1. Laporan Penjualan Harian

**Alur:**
1. Owner pilih tanggal (date picker, default hari ini)
2. Sistem query transaksi di tanggal tersebut
3. Tampilkan summary:
   - Total Transaksi (jumlah transaksi)
   - Total Pendapatan (sum total penjualan)
   - Total Harga Pokok Penjualan / HPP (sum harga beli × jumlah terjual)
   - Total Laba Kotor (pendapatan - HPP)
   - Breakdown per metode bayar (tunai, transfer, kartu, QRIS: jumlah transaksi, total)

**Output:**
- Card summary (angka besar, mudah dibaca)
- Tabel detail transaksi (nomor, waktu, kasir, total, metode bayar)
- Button "Ekspor PDF/Excel" (V2)

**Formula:**
- Pendapatan = sum(total setelah diskon dari semua transaksi)
- HPP = sum(harga beli × jumlah terjual per item di semua transaksi)
- Laba Kotor = Pendapatan - HPP
- (Laba Kotor bukan Laba Bersih karena tidak hitung biaya operasional, gaji, listrik, dll)

#### 6.8.2. Laporan Barang Terlaris

**Alur:**
1. Owner pilih periode (date range: dari tanggal - sampai tanggal, default bulan ini)
2. Sistem query transaksi di periode tersebut
3. Hitung total kuantitas terjual per barang (sum jumlah dari transaksi_detail group by barang)
4. Sortir descending (terbanyak di atas)
5. Tampilkan top 10 barang

**Output:**
- Tabel kolom: Ranking, Nama Barang, Kategori, Merek, Total Terjual (kuantitas), Total Revenue (sum harga jual × jumlah), Total Laba (sum (harga jual - harga beli) × jumlah)
- Chart bar sederhana (opsional)

**Alternatif View:**
- Owner bisa toggle ranking berdasarkan:
  - Total Kuantitas Terjual (default)
  - Total Revenue
  - Total Laba

#### 6.8.3. Laporan Stok Menipis

**Alur:**
1. Owner buka menu "Laporan Stok Menipis"
2. Sistem query barang yang `stok <= stok_minimum`
3. Tampilkan daftar barang

**Output:**
- Tabel kolom: Kode Barang, Nama Barang, Kategori, Merek, Stok Saat Ini, Stok Minimum, Selisih (stok - stok minimum)
- Highlight merah jika stok = 0 (habis)
- Highlight kuning jika stok <= stok minimum
- Sortir stok terkecil di atas (paling urgent restock)

**Aksi:**
- Button "Buat Pesanan Pembelian" per item (redirect ke form pembelian, pre-fill barang ini)

#### 6.8.4. Laporan Kas Harian

**Alur:**
1. Owner pilih tanggal (date picker, default hari ini)
2. Sistem hitung:
   - Saldo Awal (dari tabel kas atau saldo akhir hari sebelumnya, untuk MVP bisa manual input saldo awal hari ini)
   - Kas Masuk = penjualan tunai hari ini
   - Kas Keluar = pembelian tunai hari ini (status bayar = lunas, metode bayar = tunai)
   - Saldo Akhir = Saldo Awal + Kas Masuk - Kas Keluar
3. Tampilkan summary

**Output:**
- Card summary:
  - Saldo Awal: Rp [X]
  - Kas Masuk: Rp [Y] (detail: penjualan tunai)
  - Kas Keluar: Rp [Z] (detail: pembelian tunai)
  - Saldo Akhir: Rp [X+Y-Z]
- Tabel detail kas masuk (transaksi penjualan tunai)
- Tabel detail kas keluar (pembelian tunai, pembayaran hutang tunai di V2)

**Validasi:**
- Saldo awal hari pertama bisa input manual (misal kas awal toko = 5 juta)
- Saldo akhir hari ini = saldo awal hari besok (otomatis)

**Edge Case:**
- Jika saldo akhir negatif → warning: "Saldo kas negatif, periksa transaksi atau tambah modal kas"

---

### 6.9. Manajemen Hutang Supplier

**Aktor:** Admin, Owner  
**Trigger:** Admin buka menu "Hutang Supplier"

#### 6.9.1. Daftar Hutang Supplier

**Alur:**
1. Admin buka menu "Hutang Supplier"
2. Sistem query semua hutang yang belum lunas (sisa hutang > 0)
3. Tampilkan daftar hutang

**Output:**
- Tabel kolom: Supplier, Nomor Pembelian, Tanggal Pembelian, Total Hutang, Sudah Dibayar, Sisa Hutang, Jatuh Tempo, Status (Belum Jatuh Tempo/Jatuh Tempo/Terlambat), Aksi (Bayar Hutang)
- Highlight merah jika jatuh tempo < hari ini (terlambat)
- Highlight kuning jika jatuh tempo = hari ini atau besok (segera jatuh tempo)
- Sortir jatuh tempo terdekat di atas

**Filter:**
- Filter supplier (dropdown)
- Filter status (semua/belum jatuh tempo/jatuh tempo/terlambat)

#### 6.9.2. Bayar Hutang

**Alur:**
1. Admin klik "Bayar Hutang" di daftar hutang
2. Form pembayaran hutang muncul:
   - Supplier (readonly, dari data hutang)
   - Nomor Pembelian (readonly)
   - Total Hutang (readonly)
   - Sudah Dibayar (readonly)
   - Sisa Hutang (readonly)
   - Tanggal Bayar (date, required, default hari ini)
   - Jumlah Bayar (number, required, min 1, max sisa hutang)
   - Metode Bayar (dropdown, required, pilih: Tunai/Transfer/Kartu)
3. Admin input jumlah bayar dan metode
4. Klik "Simpan"
5. Sistem validasi input
6. Jika valid → simpan pembayaran ke database → update sisa hutang (sisa hutang -= jumlah bayar) → jika sisa hutang = 0, status hutang = lunas → kas berkurang (jika tunai) → pesan sukses
7. Jika tidak valid → tampilkan error

**Input:**
- Tanggal Bayar (date, required, default hari ini, tidak boleh tanggal masa depan)
- Jumlah Bayar (number, required, min 1, max sisa hutang)
- Metode Bayar (dropdown, required)

**Output:**
- Data pembayaran tersimpan di tabel `pembayaran_hutang`
- Sisa hutang di tabel `hutang_supplier` berkurang
- Jika sisa hutang = 0 → status hutang = "Lunas"
- Kas berkurang (jika metode bayar = tunai)
- Pesan sukses: "Pembayaran hutang ke [Supplier] sebesar Rp [X] berhasil disimpan. Sisa hutang: Rp [Y]"

**Validasi:**
- Jumlah bayar harus > 0 dan <= sisa hutang → error: "Jumlah bayar harus antara Rp 1 sampai Rp [Sisa Hutang]"
- Tanggal bayar tidak boleh tanggal masa depan → error: "Tanggal bayar tidak boleh tanggal masa depan"

**Edge Case:**
- Admin bayar cicilan (tidak lunas sekaligus) → izinkan, sisa hutang berkurang sesuai jumlah bayar
- Admin bayar lebih dari sisa hutang → tidak boleh, validasi max = sisa hutang
- Hutang sudah lunas (sisa hutang = 0) → tombol "Bayar Hutang" disabled atau tidak muncul di daftar hutang aktif

---

### 6.10. Dashboard

**Aktor:** Semua user (konten berbeda per role)  
**Trigger:** User login → redirect ke dashboard

**Konten Dashboard Owner/Admin:**
- **Summary Hari Ini:**
  - Total Transaksi (jumlah)
  - Total Penjualan (Rp)
  - Total Laba Kotor (Rp)
  - Stok Menipis (jumlah item)
- **Chart Penjualan 7 Hari Terakhir** (bar chart sederhana, sumbu X = tanggal, sumbu Y = total penjualan)
- **Tabel Barang Terlaris Hari Ini** (top 5)
- **Tabel Stok Menipis** (5 item paling urgent)
- **Tabel Hutang Jatuh Tempo** (hutang yang jatuh tempo hari ini atau besok, top 5)
- Quick action buttons:
  - "Tambah Transaksi" (redirect ke POS)
  - "Tambah Pembelian" (redirect ke form pembelian)
  - "Lihat Laporan Lengkap"

**Konten Dashboard Kasir:**
- Summary shift hari ini (transaksi kasir ini, total penjualan kasir ini)
- Quick action buttons:
  - "Transaksi Baru" (redirect ke POS)
  - "Histori Transaksi Saya"

**Data Source:**
- Query database real-time (tidak perlu cache untuk MVP, skala kecil)

---

## 7. Sketsa Data Model

### Tabel: users
| Field       | Tipe          | Keterangan                        |
|-------------|---------------|-----------------------------------|
| id          | INT (PK, AI)  | ID user                           |
| username    | VARCHAR(50)   | Username login (unique)           |
| password    | VARCHAR(255)  | Password (hashed, bcrypt)         |
| nama        | VARCHAR(100)  | Nama lengkap user                 |
| role        | ENUM          | 'Owner', 'Admin', 'Kasir'         |
| created_at  | DATETIME      | Tanggal dibuat                    |
| updated_at  | DATETIME      | Tanggal diupdate                  |

### Tabel: kategori
| Field       | Tipe          | Keterangan                        |
|-------------|---------------|-----------------------------------|
| id          | INT (PK, AI)  | ID kategori                       |
| nama        | VARCHAR(100)  | Nama kategori (unique)            |
| deskripsi   | TEXT          | Deskripsi kategori (optional)     |
| created_at  | DATETIME      |                                   |
| updated_at  | DATETIME      |                                   |

### Tabel: merek
| Field       | Tipe          | Keterangan                        |
|-------------|---------------|-----------------------------------|
| id          | INT (PK, AI)  | ID merek                          |
| nama        | VARCHAR(100)  | Nama merek (unique)               |
| created_at  | DATETIME      |                                   |
| updated_at  | DATETIME      |                                   |

### Tabel: barang
| Field         | Tipe          | Keterangan                          |
|---------------|---------------|-------------------------------------|
| id            | INT (PK, AI)  | ID barang                           |
| kode          | VARCHAR(20)   | Kode barang (unique)                |
| nama          | VARCHAR(200)  | Nama barang                         |
| kategori_id   | INT (FK)      | Ref: kategori.id                    |
| merek_id      | INT (FK)      | Ref: merek.id                       |
| satuan        | VARCHAR(20)   | 'Unit', 'Pcs', 'Set'                |
| harga_beli    | DECIMAL(15,2) | Harga beli per unit (default)       |
| harga_jual    | DECIMAL(15,2) | Harga jual per unit                 |
| stok          | INT           | Stok saat ini (real-time)           |
| stok_minimum  | INT           | Batas minimum stok (alert)          |
| deskripsi     | TEXT          | Deskripsi barang (optional)         |
| created_at    | DATETIME      |                                     |
| updated_at    | DATETIME      |                                     |

### Tabel: supplier
| Field       | Tipe          | Keterangan                        |
|-------------|---------------|-----------------------------------|
| id          | INT (PK, AI)  | ID supplier                       |
| nama        | VARCHAR(200)  | Nama supplier                     |
| kontak      | VARCHAR(50)   | Nomor telepon/HP                  |
| alamat      | TEXT          | Alamat supplier                   |
| created_at  | DATETIME      |                                   |
| updated_at  | DATETIME      |                                   |

### Tabel: pembelian
| Field          | Tipe          | Keterangan                               |
|----------------|---------------|------------------------------------------|
| id             | INT (PK, AI)  | ID pembelian                             |
| nomor          | VARCHAR(50)   | Nomor pembelian (unique, auto)           |
| tanggal        | DATE          | Tanggal pembelian                        |
| supplier_id    | INT (FK)      | Ref: supplier.id                         |
| total          | DECIMAL(15,2) | Total pembelian                          |
| status_bayar   | ENUM          | 'Lunas', 'Hutang'                        |
| metode_bayar   | VARCHAR(20)   | 'Tunai', 'Transfer', 'Kartu' (jika lunas)|
| jatuh_tempo    | DATE          | Jatuh tempo hutang (jika hutang)         |
| user_id        | INT (FK)      | Ref: users.id (admin yang input)         |
| created_at     | DATETIME      |                                          |
| updated_at     | DATETIME      |                                          |

### Tabel: pembelian_detail
| Field         | Tipe          | Keterangan                          |
|---------------|---------------|-------------------------------------|
| id            | INT (PK, AI)  | ID detail                           |
| pembelian_id  | INT (FK)      | Ref: pembelian.id                   |
| barang_id     | INT (FK)      | Ref: barang.id                      |
| jumlah        | INT           | Jumlah barang dibeli                |
| harga_beli    | DECIMAL(15,2) | Harga beli per unit (snapshot)      |
| subtotal      | DECIMAL(15,2) | jumlah × harga_beli                 |
| created_at    | DATETIME      |                                     |

### Tabel: hutang_supplier
| Field          | Tipe          | Keterangan                               |
|----------------|---------------|------------------------------------------|
| id             | INT (PK, AI)  | ID hutang                                |
| pembelian_id   | INT (FK)      | Ref: pembelian.id (unique)               |
| supplier_id    | INT (FK)      | Ref: supplier.id                         |
| total_hutang   | DECIMAL(15,2) | Total hutang awal                        |
| sudah_dibayar  | DECIMAL(15,2) | Total yang sudah dibayar (default 0)     |
| sisa_hutang    | DECIMAL(15,2) | total_hutang - sudah_dibayar             |
| jatuh_tempo    | DATE          | Jatuh tempo hutang                       |
| status         | ENUM          | 'Belum Lunas', 'Lunas'                   |
| created_at     | DATETIME      |                                          |
| updated_at     | DATETIME      |                                          |

### Tabel: pembayaran_hutang
| Field         | Tipe          | Keterangan                          |
|---------------|---------------|-------------------------------------|
| id            | INT (PK, AI)  | ID pembayaran                       |
| hutang_id     | INT (FK)      | Ref: hutang_supplier.id             |
| tanggal_bayar | DATE          | Tanggal pembayaran                  |
| jumlah_bayar  | DECIMAL(15,2) | Jumlah yang dibayar                 |
| metode_bayar  | VARCHAR(20)   | 'Tunai', 'Transfer', 'Kartu'        |
| user_id       | INT (FK)      | Ref: users.id (admin yang input)    |
| created_at    | DATETIME      |                                     |

### Tabel: transaksi
| Field          | Tipe          | Keterangan                               |
|----------------|---------------|------------------------------------------|
| id             | INT (PK, AI)  | ID transaksi                             |
| nomor          | VARCHAR(50)   | Nomor transaksi (unique, auto)           |
| tanggal        | DATETIME      | Tanggal & waktu transaksi                |
| kasir_id       | INT (FK)      | Ref: users.id (kasir yang input)         |
| subtotal       | DECIMAL(15,2) | Total sebelum diskon                     |
| diskon_tipe    | ENUM          | 'Nominal', 'Persen', NULL                |
| diskon_nilai   | DECIMAL(15,2) | Nilai diskon (nominal atau persen)       |
| diskon_amount  | DECIMAL(15,2) | Nominal diskon (Rp)                      |
| total          | DECIMAL(15,2) | Total setelah diskon                     |
| metode_bayar   | VARCHAR(20)   | 'Tunai', 'Transfer', 'Kartu', 'QRIS'     |
| jumlah_bayar   | DECIMAL(15,2) | Jumlah yang dibayar pelanggan            |
| kembalian      | DECIMAL(15,2) | Kembalian (jika tunai)                   |
| created_at     | DATETIME      |                                          |
| updated_at     | DATETIME      |                                          |

### Tabel: transaksi_detail
| Field         | Tipe          | Keterangan                          |
|---------------|---------------|-------------------------------------|
| id            | INT (PK, AI)  | ID detail                           |
| transaksi_id  | INT (FK)      | Ref: transaksi.id                   |
| barang_id     | INT (FK)      | Ref: barang.id                      |
| jumlah        | INT           | Jumlah barang dijual                |
| harga_jual    | DECIMAL(15,2) | Harga jual per unit (snapshot)      |
| harga_beli    | DECIMAL(15,2) | Harga beli per unit (snapshot, untuk hitung laba) |
| subtotal      | DECIMAL(15,2) | jumlah × harga_jual                 |
| created_at    | DATETIME      |                                     |

### Tabel: kas (opsional untuk MVP, bisa manual dulu)
| Field         | Tipe          | Keterangan                          |
|---------------|---------------|-------------------------------------|
| id            | INT (PK, AI)  | ID kas                              |
| tanggal       | DATE          | Tanggal kas (unique)                |
| saldo_awal    | DECIMAL(15,2) | Saldo awal hari ini                 |
| kas_masuk     | DECIMAL(15,2) | Total kas masuk (penjualan tunai)   |
| kas_keluar    | DECIMAL(15,2) | Total kas keluar (pembelian tunai)  |
| saldo_akhir   | DECIMAL(15,2) | saldo_awal + kas_masuk - kas_keluar |
| created_at    | DATETIME      |                                     |
| updated_at    | DATETIME      |                                     |

**Catatan Data Model:**
- **Primary Key (PK):** Auto-increment INT
- **Foreign Key (FK):** ON DELETE RESTRICT (tidak boleh hapus jika ada relasi)
- **DECIMAL(15,2):** Format uang Rupiah (max 999 triliun, 2 desimal)
- **DATETIME vs DATE:** Transaksi pakai DATETIME (ada jam), pembelian/kas pakai DATE
- **Nomor Transaksi/Pembelian:** Auto-generate format "TRX-YYYYMMDD-NNNN" atau "BUY-YYYYMMDD-NNNN"

---

## 8. Edge Case dan Failure State

### 8.1. Stok
- **Stok negatif:** Tidak boleh. Validasi sebelum simpan transaksi. Jika stok tidak cukup, transaksi ditolak. **Kecuali:** Owner bisa override dengan alasan (fitur V2).
- **Stok berubah saat transaksi berlangsung:** Kasir A menambahkan barang X (stok 5) ke keranjang, belum checkout. Kasir B checkout barang X (stok jadi 3). Saat kasir A checkout (mau beli 5), validasi ulang stok, jika tidak cukup → error, kasir A harus kurangi jumlah.
- **Stok opname selisih besar:** Admin input stok fisik beda jauh dari sistem (misal sistem 100, fisik 80, selisih -20). Sistem catat selisih, minta alasan, update stok sistem jadi 80. Owner bisa audit laporan stok opname untuk cek pencurian/kehilangan.

### 8.2. Transaksi
- **Transaksi gagal setelah stok berkurang:** Jika database rollback gagal (misal server crash), stok bisa berkurang tanpa transaksi tercatat. **Solusi:** Gunakan database transaction (BEGIN, COMMIT, ROLLBACK) untuk atomicity. Jika transaksi gagal, stok rollback otomatis.
- **Struk tidak tercetak:** Jika printer error atau browser crash setelah transaksi tersimpan, struk tidak tercetak. **Solusi:** Transaksi sudah tersimpan di database, kasir bisa cetak ulang dari histori transaksi.
- **Pembeli komplain harga/barang:** Kasir cek histori transaksi berdasarkan nomor transaksi atau tanggal. Jika ada kesalahan, untuk MVP belum ada fitur koreksi transaksi (masuk V2: retur penjualan). Kasir harus lapor owner untuk solusi manual (refund tunai, catat di buku).

### 8.3. Pembelian dan Hutang
- **Jatuh tempo hutang terlewat:** Sistem highlight hutang terlambat (merah) di dashboard dan daftar hutang. Owner bisa bayar cicilan atau lunas kapan saja (tidak ada penalty otomatis, penalty manual jika ada deal dengan supplier).
- **Supplier ganti nama/kontak:** Admin edit data supplier, tidak pengaruhi hutang lama (hutang tetap link ke supplier_id).
- **Pembelian ganda (double entry):** Admin tidak sengaja input pembelian yang sama 2 kali. **Solusi:** Untuk MVP belum ada deteksi otomatis, admin harus hati-hati. V2 bisa tambah konfirmasi jika pembelian supplier+tanggal sama dalam 5 menit terakhir.

### 8.4. User dan Akses
- **Kasir logout tidak sengaja saat transaksi berlangsung:** Keranjang hilang (keranjang tidak tersimpan di database untuk MVP, hanya di session). Kasir harus input ulang. **Solusi V2:** Simpan keranjang di localStorage atau database (draft transaksi).
- **Kasir mencoba akses laporan owner:** Sistem cek role sebelum render halaman. Jika role != Owner/Admin → redirect ke dashboard kasir, tampilkan error: "Anda tidak memiliki akses ke halaman ini."
- **Admin ubah harga jual saat ada transaksi berlangsung:** Harga jual di transaksi pakai snapshot (harga saat transaksi dibuat), bukan harga real-time di master barang. Jadi tidak pengaruhi transaksi yang sedang berjalan.

### 8.5. Laporan
- **Laporan kosong (tidak ada transaksi):** Tampilkan pesan: "Belum ada transaksi di periode ini."
- **Laba kotor negatif (jual rugi):** Jika admin ubah harga jual lebih rendah dari harga beli, laba bisa negatif. Sistem tetap hitung dan tampilkan (angka merah). Owner bisa audit barang mana yang rugi.
- **Laporan periode panjang lambat load:** Untuk MVP, query langsung ke database (no cache). Jika lambat (>5 detik), tambahkan loading indicator. V2 bisa tambah cache atau summary table harian.

### 8.6. Data Konsistensi
- **Foreign key invalid (misal barang dihapus tapi ada transaksi):** Database constraint ON DELETE RESTRICT mencegah hapus barang yang punya transaksi. Jika tetap perlu hapus (barang discontinue), V2 tambah soft delete (status: 'Aktif', 'Non-Aktif') bukan hapus permanen.
- **Race condition (2 user edit data sama bersamaan):** Untuk MVP, last write wins (update terakhir yang tersimpan). V2 bisa tambah optimistic locking (version field).

---

## 9. Success Metrics

### 9.1. Adoption Metrics (Setelah Go-Live)
- **Target:** 100% transaksi toko dicatat di sistem (tidak ada lagi pencatatan manual di buku/Excel) dalam 1 minggu pertama.
- **Pengukuran:** Bandingkan jumlah transaksi di sistem vs kas fisik harian. Jika selisih >5%, investigasi penyebab (kasir masih pakai buku, sistem crash, dll).

### 9.2. Efficiency Metrics
- **Waktu transaksi kasir:** Target <2 menit per transaksi (dari pilih barang pertama sampai cetak struk). Bandingkan dengan waktu manual sebelumnya (~5 menit).
- **Waktu pembuatan laporan owner:** Target <5 menit untuk laporan harian (dari buka menu sampai lihat laba kotor). Bandingkan dengan waktu manual sebelumnya (~2 jam).
- **Akurasi stok:** Target selisih stok sistem vs stok fisik <5% setiap stok opname bulanan. (Stok manual sering selisih >20%).

### 9.3. Business Impact Metrics
- **Pengurangan overstock:** Target pengurangan modal mati di barang slow-moving 20% dalam 3 bulan (owner bisa lihat barang terlaris, fokus restock barang untung).
- **Pengurangan stock-out:** Target pengurangan komplain "barang habis" 50% dalam 3 bulan (peringatan stok menipis mencegah kehabisan barang bestseller).
- **Margin consistency:** Target selisih harga jual per barang (antara transaksi berbeda) <1% (harga jual dari master data, tidak asal tebak kasir).

### 9.4. User Satisfaction
- **Kasir satisfaction:** Survey sederhana setelah 1 bulan: "Sistem ini lebih mudah/sama/lebih susah dibanding pencatatan manual?" Target: >80% jawab "lebih mudah".
- **Owner confidence:** Survey owner: "Saya yakin laporan laba/stok di sistem akurat?" Target: >90% jawab "yakin" setelah 1 bulan.

### 9.5. Technical Metrics
- **System uptime:** Target >99% (sistem localhost Laragon, downtime hanya jika server restart atau maintenance).
- **Error rate:** Target <1% transaksi gagal karena bug sistem (tidak termasuk user error seperti stok tidak cukup).
- **Response time:** Target <2 detik untuk load halaman POS, <5 detik untuk load laporan.

---

## 10. Open Questions

### 10.1. Master Data
1. **Apakah barang bisa punya varian (misal iPhone 14 Pro Max 256GB warna berbeda: Hitam, Putih, Ungu)?** Untuk MVP, anggap setiap varian = barang terpisah (kode berbeda). V2 bisa tambah fitur variant (1 barang master, banyak variant dengan stok terpisah).
2. **Apakah harga jual bisa berbeda per pelanggan (misal harga grosir vs retail)?** Untuk MVP, harga jual sama untuk semua pembeli. V2 bisa tambah harga grosir + minimum qty.
3. **Apakah barang expired/serial number perlu dilacak (misal garansi)?** Untuk MVP, tidak perlu. V2 bisa tambah field nomor serial atau tanggal expired (untuk barang tertentu).

### 10.2. Transaksi
4. **Apakah pelanggan bisa kredit (beli sekarang, bayar nanti)?** Untuk MVP, semua transaksi POS = bayar langsung (tunai/transfer/kartu/QRIS). Piutang pelanggan masuk V2 (butuh master pelanggan + laporan piutang pelanggan).
5. **Apakah kasir bisa batal transaksi setelah disimpan (void)?** Untuk MVP, tidak bisa (transaksi permanen). Jika ada kesalahan, untuk sementara pakai retur penjualan (V2) atau koreksi manual owner. V2 bisa tambah fitur void transaksi (khusus Owner, hari yang sama, dengan alasan).
6. **Apakah bisa transaksi tanpa cetak struk (hemat kertas)?** Untuk MVP, struk ditampilkan di browser (bisa print atau tidak). Jika tidak print, transaksi tetap tersimpan. V2 bisa tambah opsi "kirim struk via WhatsApp/email".

### 10.3. Stok dan Gudang
7. **Apakah ada konsep gudang vs display (stok gudang belum bisa dijual langsung)?** Untuk MVP, semua stok = stok jual (tidak ada pemisahan gudang vs display). V2 bisa tambah multi-lokasi stok.
8. **Apakah stok bisa dipindahkan antar lokasi (misal gudang ke display)?** Untuk MVP, tidak perlu (1 toko, 1 lokasi stok). V2 bisa tambah mutasi stok antar lokasi.
9. **Apakah ada barang konsinyasi (barang supplier, toko tidak beli dulu, bayar setelah laku)?** Untuk MVP, tidak support. Semua pembelian = toko beli dari supplier (lunas atau hutang). Konsinyasi bisa masuk V2 (flag barang konsinyasi, bayar supplier setelah terjual).

### 10.4. Pembayaran
10. **Apakah QRIS perlu integrasi otomatis (cek pembayaran via API)?** Untuk MVP, QRIS = metode bayar manual (kasir pilih QRIS, asumsi pembeli sudah bayar, tidak ada validasi otomatis). V2 bisa tambah integrasi payment gateway.
11. **Apakah bisa split payment (misal tunai + kartu)?** Untuk MVP, 1 transaksi = 1 metode bayar. Jika pembeli mau split, kasir pilih metode bayar dominan (misal jika 80% tunai, 20% kartu → pilih tunai, input total bayar = total transaksi). V2 bisa tambah split payment (list metode bayar + nominal per metode).

### 10.5. Laporan dan Pajak
12. **Apakah laporan perlu breakdown PPN (pajak pertambahan nilai)?** Untuk MVP, tidak ada PPN (harga jual sudah include semua). Owner hitung pajak manual nanti. V2 bisa tambah flag barang kena PPN + laporan PPN.
13. **Apakah laporan perlu ekspor Excel/PDF?** Untuk MVP, laporan tampil di browser (bisa print to PDF via browser). V2 bisa tambah button ekspor langsung ke Excel/PDF.
14. **Apakah owner perlu notifikasi otomatis (email/WhatsApp) jika stok menipis atau hutang jatuh tempo?** Untuk MVP, tidak ada notifikasi otomatis. Owner harus buka dashboard/laporan manual. V2 bisa tambah notifikasi otomatis.

### 10.6. User dan Keamanan
15. **Apakah perlu log aktivitas user (audit trail: siapa edit barang apa kapan)?** Untuk MVP, hanya catat user yang buat transaksi/pembelian (field `user_id`). Log detail aktivitas masuk V2 (tabel `audit_log`).
16. **Apakah owner bisa override stok (misal stok negatif untuk kasus khusus)?** Untuk MVP, stok tidak boleh negatif (strict). Jika ada kasus khusus (misal jual dulu, stok nyusul), owner harus masukkan pembelian fiktif dulu atau pakai stok opname untuk koreksi. V2 bisa tambah fitur override dengan alasan (log ke audit).

### 10.7. Teknis
17. **Apakah sistem perlu backup otomatis database?** Untuk MVP, backup manual (owner/admin backup database Laragon manual setiap hari/minggu). V2 bisa tambah script backup otomatis harian.
18. **Apakah perlu print ke printer thermal langsung (bukan via browser print)?** Untuk MVP, print via browser (window.print()). V2 bisa tambah integrasi printer thermal via driver atau plugin.
19. **Apakah kasir bisa pakai barcode scanner untuk input barang?** Untuk MVP, input manual (search/dropdown barang). V2 bisa tambah input barcode (simpan barcode di master barang, kasir scan barcode, sistem auto-pilih barang).

---

## Penutup

PRD ini adalah dokumen hidup. Setelah MVP go-live, kita akan iterasi berdasarkan feedback user (owner, kasir, admin) dan metrics di atas. Prioritas V2 akan disesuaikan berdasarkan:
1. **Pain point terbesar user** (survey feedback)
2. **Business impact tertinggi** (misal retur penjualan vs laporan lanjutan, mana yang lebih urgent)
3. **Technical feasibility** (effort vs value)

**Next Steps:**
1. Review PRD dengan owner/stakeholder → finalisasi scope MVP
2. Technical design (stack: Laravel/PHP, MySQL, Laragon localhost, responsive web)
3. Development sprint MVP (estimasi 4-6 minggu)
4. UAT (User Acceptance Testing) dengan owner + kasir (1 minggu)
5. Go-live MVP
6. Monitoring metrics + feedback collection (2 minggu)
7. Prioritas V2 backlog

---

**Dokumen ini disusun tanggal 28 September 2026. Untuk pertanyaan atau perubahan, hubungi Product Manager.**
