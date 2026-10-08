// Central Data Engine & State Storage for Bunda Jaya Elektronik
// Updated to use Backend API instead of localStorage

import { api } from './api/client.js';

const DEFAULT_USERS = [
  { id: 1, username: 'budi', name: 'Budi (Owner)', role: 'Owner' },
  { id: 2, username: 'admin', name: 'Admin Toko', role: 'Admin' }
];

const DEFAULT_KATEGORI = [
  { id: 1, nama: 'Handphone & Gadget', deskripsi: 'Smartphone, tablet, dan wearable' },
  { id: 2, nama: 'TV & Audio', deskripsi: 'Smart TV, LED TV, soundbar, speaker active' },
  { id: 3, nama: 'Pendingin (AC & Kipas)', deskripsi: 'AC Split, Kipas Angin, Air Cooler' },
  { id: 4, nama: 'Mesin Cuci & Kulkas', deskripsi: 'Kulkas 1-2 pintu, mesin cuci top/front loading' },
  { id: 5, nama: 'Laptop & Komputer', deskripsi: 'Laptop kantor, gaming, dan aksesoris PC' },
  { id: 6, nama: 'Aksesoris & Fast Moving', deskripsi: 'Charger, kabel data, earphone, powerbank' }
];

const DEFAULT_MEREK = [
  { id: 1, nama: 'Apple' },
  { id: 2, nama: 'Samsung' },
  { id: 3, nama: 'LG' },
  { id: 4, nama: 'Polytron' },
  { id: 5, nama: 'Sharp' },
  { id: 6, nama: 'Sony' },
  { id: 7, nama: 'Panasonic' },
  { id: 8, nama: 'Anker' },
  { id: 9, nama: 'Asus' }
];

const DEFAULT_SUPPLIER = [
  { id: 1, nama: 'PT Samsung Electronics Indonesia', kontak: '0812-9988-7766', alamat: 'Jl. Industri Selatan No. 12, Cikarang, Bekasi' },
  { id: 2, nama: 'PT LG Electronics Indonesia', kontak: '0811-2233-4455', alamat: 'Kawasan Industri MM2100, Cibitung' },
  { id: 3, nama: 'PT Polytron Indonesia (Djarum Group)', kontak: '0813-4455-6677', alamat: 'Jl. Ahmad Yani No. 58, Kudus, Jawa Tengah' },
  { id: 4, nama: 'CV Jaya Makmur Aksesoris', kontak: '0856-7788-9900', alamat: 'Ruko Harco Mangga Dua Blok B-15, Jakarta Pusat' },
  { id: 5, nama: 'PT Sharp Trading Indonesia', kontak: '0815-1122-3344', alamat: 'Jl. Swadaya IV, Pulogadung, Jakarta Timur' }
];

const DEFAULT_BARANG = [
  {
    id: 1,
    kode: 'HP-IP14PM-256',
    nama: 'iPhone 14 Pro Max 256GB Deep Purple',
    kategori_id: 1,
    merek_id: 1,
    satuan: 'Unit',
    harga_beli: 18200000,
    harga_jual: 19850000,
    stok: 5,
    stok_minimum: 2,
    deskripsi: 'Garansi Resmi iBox Indonesia 1 Tahun, Chip A16 Bionic, 48MP Main Camera'
  },
  {
    id: 2,
    kode: 'HP-S23U-512',
    nama: 'Samsung Galaxy S23 Ultra 5G 12/512GB Phantom Black',
    kategori_id: 1,
    merek_id: 2,
    satuan: 'Unit',
    harga_beli: 17500000,
    harga_jual: 18990000,
    stok: 3,
    stok_minimum: 2,
    deskripsi: 'Snapdragon 8 Gen 2 for Galaxy, 200MP Camera, S-Pen Integrated'
  },
  {
    id: 3,
    kode: 'TV-LG-43UR75',
    nama: 'LG 43 Inch Smart 4K UHD TV 43UR7550PSC',
    kategori_id: 2,
    merek_id: 3,
    satuan: 'Unit',
    harga_beli: 4100000,
    harga_jual: 4650000,
    stok: 8,
    stok_minimum: 3,
    deskripsi: 'webOS Smart TV, ThinQ AI, HDR10 Pro, Magic Remote Support'
  },
  {
    id: 4,
    kode: 'TV-PLY-32D150',
    nama: 'Polytron 32 Inch LED Digital TV PLD 32D1500',
    kategori_id: 2,
    merek_id: 4,
    satuan: 'Unit',
    harga_beli: 1750000,
    harga_jual: 19990000 / 10, // 1.999.000
    stok: 12,
    stok_minimum: 5,
    deskripsi: 'Tower Speaker Garansi 5 Tahun Termasuk Panel LED, DVB-T2 Ready'
  },
  {
    id: 5,
    kode: 'AC-SRP-05BEY',
    nama: 'Sharp AC Split 1/2 PK AH-A5BEY Low Watt',
    kategori_id: 3,
    merek_id: 5,
    satuan: 'Unit',
    harga_beli: 2750000,
    harga_jual: 3150000,
    stok: 4,
    stok_minimum: 3,
    deskripsi: 'Garansi Kompresor 10 Tahun, R32 Eco Refrigerant, 360 Watt'
  },
  {
    id: 6,
    kode: 'KPS-CSM-16SDB',
    nama: 'Cosmos Kipas Angin Berdiri 16 Inch 16-SDB',
    kategori_id: 3,
    merek_id: 7,
    satuan: 'Unit',
    harga_beli: 260000,
    harga_jual: 310000,
    stok: 1, // LOW STOCK ALERT
    stok_minimum: 3,
    deskripsi: 'Bisa diatur tinggi rendah, 3 pilihan kecepatan, hemat listrik 45W'
  },
  {
    id: 7,
    kode: 'KLK-PLY-PRB215',
    nama: 'Polytron Kulkas 2 Pintu Belleza V PRB 215B',
    kategori_id: 4,
    merek_id: 4,
    satuan: 'Unit',
    harga_beli: 2650000,
    harga_jual: 2990000,
    stok: 2, // LOW STOCK ALERT
    stok_minimum: 3,
    deskripsi: 'Tempered Glass Door, Jumbo Freezer, Humidity Control Crisper'
  },
  {
    id: 8,
    kode: 'LPT-ASU-X1404',
    nama: 'Asus Vivobook Go 14 E1404GA Intel N100 8GB/256GB SSD',
    kategori_id: 5,
    merek_id: 9,
    satuan: 'Unit',
    harga_beli: 5100000,
    harga_jual: 5699000,
    stok: 6,
    stok_minimum: 2,
    deskripsi: 'FHD IPS Screen, Windows 11 Original + OHS 2021, Garansi Resmi 2 Thn'
  },
  {
    id: 9,
    kode: 'ACC-ANK-311',
    nama: 'Anker PowerPort III 20W Cube Wall Charger USB-C',
    kategori_id: 6,
    merek_id: 8,
    satuan: 'Pcs',
    harga_beli: 115000,
    harga_jual: 169000,
    stok: 0, // OUT OF STOCK ALERT
    stok_minimum: 5,
    deskripsi: 'Fast Charging untuk iPhone 12/13/14/15, PowerIQ 3.0 Technology'
  },
  {
    id: 10,
    kode: 'ACC-ANK-CBL3',
    nama: 'Anker Cable Type-C to Lightning 0.9m Nylon Braided',
    kategori_id: 6,
    merek_id: 8,
    satuan: 'Pcs',
    harga_beli: 135000,
    harga_jual: 189000,
    stok: 15,
    stok_minimum: 5,
    deskripsi: 'MFi Certified, Tahan 12.000x Tekukan, Garansi 18 Bulan'
  }
];

// Helper date generator for seed transactions (tanggal LOKAL, bukan UTC)
const getTodayStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function todayLocal() {
  return getTodayStr(0);
}

const DEFAULT_PEMBELIAN = [
  {
    id: 1,
    nomor: 'BUY-20260920-0001',
    tanggal: getTodayStr(8),
    supplier_id: 1,
    total: 35000000,
    status_bayar: 'Hutang',
    metode_bayar: null,
    jatuh_tempo: getTodayStr(-2), // Overdue by 2 days (urgent amber/red alert!)
    user_id: 2,
    items: [
      { barang_id: 2, jumlah: 2, harga_beli: 17500000, subtotal: 35000000 }
    ]
  },
  {
    id: 2,
    nomor: 'BUY-20260924-0002',
    tanggal: getTodayStr(4),
    supplier_id: 4,
    total: 3750000,
    status_bayar: 'Lunas',
    metode_bayar: 'Transfer',
    jatuh_tempo: null,
    user_id: 2,
    items: [
      { barang_id: 9, jumlah: 15, harga_beli: 115000, subtotal: 1725000 },
      { barang_id: 10, jumlah: 15, harga_beli: 135000, subtotal: 2025000 }
    ]
  },
  {
    id: 3,
    nomor: 'BUY-20260926-0003',
    tanggal: getTodayStr(2),
    supplier_id: 3,
    total: 7950000,
    status_bayar: 'Hutang',
    metode_bayar: null,
    jatuh_tempo: getTodayStr(-5), // Due in 5 days
    user_id: 2,
    items: [
      { barang_id: 4, jumlah: 3, harga_beli: 1750000, subtotal: 5250000 },
      { barang_id: 7, jumlah: 1, harga_beli: 2700000, subtotal: 2700000 }
    ]
  }
];

const DEFAULT_HUTANG = [
  {
    id: 1,
    pembelian_id: 1,
    supplier_id: 1,
    total_hutang: 35000000,
    sudah_dibayar: 15000000,
    sisa_hutang: 20000000,
    jatuh_tempo: getTodayStr(-2), // Overdue!
    status: 'Belum Lunas'
  },
  {
    id: 2,
    pembelian_id: 3,
    supplier_id: 3,
    total_hutang: 7950000,
    sudah_dibayar: 0,
    sisa_hutang: 7950000,
    jatuh_tempo: getTodayStr(-5), // Active
    status: 'Belum Lunas'
  }
];

const DEFAULT_TRANSAKSI = [
  {
    id: 1,
    nomor: 'TRX-20260928-0001',
    tanggal: `${getTodayStr(0)} 10:15:00`,
    kasir_id: 3,
    subtotal: 19850000,
    diskon_tipe: 'Nominal',
    diskon_nilai: 150000,
    diskon_amount: 150000,
    total: 19700000,
    metode_bayar: 'Transfer',
    jumlah_bayar: 19700000,
    kembalian: 0,
    items: [
      { barang_id: 1, nama: 'iPhone 14 Pro Max 256GB Deep Purple', jumlah: 1, harga_jual: 19850000, harga_beli: 18200000, subtotal: 19850000 }
    ]
  },
  {
    id: 2,
    nomor: 'TRX-20260928-0002',
    tanggal: `${getTodayStr(0)} 11:30:00`,
    kasir_id: 3,
    subtotal: 4960000,
    diskon_tipe: null,
    diskon_nilai: 0,
    diskon_amount: 0,
    total: 4960000,
    metode_bayar: 'Tunai',
    jumlah_bayar: 5000000,
    kembalian: 40000,
    items: [
      { barang_id: 3, nama: 'LG 43 Inch Smart 4K UHD TV 43UR7550PSC', jumlah: 1, harga_jual: 4650000, harga_beli: 4100000, subtotal: 4650000 },
      { barang_id: 6, nama: 'Cosmos Kipas Angin Berdiri 16 Inch 16-SDB', jumlah: 1, harga_jual: 310000, harga_beli: 260000, subtotal: 310000 }
    ]
  },
  {
    id: 3,
    nomor: 'TRX-20260927-0003',
    tanggal: `${getTodayStr(1)} 15:45:00`,
    kasir_id: 3,
    subtotal: 3150000,
    diskon_tipe: 'Persen',
    diskon_nilai: 5,
    diskon_amount: 157500,
    total: 2992500,
    metode_bayar: 'QRIS',
    jumlah_bayar: 2992500,
    kembalian: 0,
    items: [
      { barang_id: 5, nama: 'Sharp AC Split 1/2 PK AH-A5BEY Low Watt', jumlah: 1, harga_jual: 3150000, harga_beli: 2750000, subtotal: 3150000 }
    ]
  }
];

class Store {
  constructor() {
    this.currentUser = null;
    this.cache = {
      barang: [],
      kategori: [],
      merek: [],
      supplier: [],
      lastFetch: {}
    };
  }

  // ============================================
  // Authentication
  // ============================================

  async changePassword(oldPassword, newPassword) {
    const response = await api.changePassword({ old_password: oldPassword, new_password: newPassword });
    if (response.success) return true;
    throw new Error(response.message);
  }

  // ============================================
  // Users (Owner only)
  // ============================================

  async getUsers() {
    const response = await api.getUsers();
    if (response.success) return response.data;
    throw new Error(response.message);
  }

  async createUser(data) {
    const response = await api.createUser(data);
    if (response.success) return response.data;
    throw new Error(response.message);
  }

  async updateUser(data) {
    const response = await api.updateUser(data);
    if (response.success) return true;
    throw new Error(response.message);
  }
  
  async login(username, password) {
    try {
      const response = await api.login(username, password);
      if (response.success) {
        const user = response.data.user;
        // Normalize: API returns 'nama', ensure 'name' also exists
        user.name = user.name || user.nama;
        this.currentUser = user;
        // Simpan CSRF token untuk request state-changing berikutnya
        if (response.data.csrf_token) {
          api.csrfToken = response.data.csrf_token;
        }
        return user;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async checkSession() {
    try {
      const response = await api.checkSession();
      if (response.success) {
        const user = response.data.user;
        // Normalize: API returns 'nama', ensure 'name' also exists
        user.name = user.name || user.nama;
        this.currentUser = user;
        // Refresh CSRF token (misal setelah reload halaman)
        if (response.data.csrf_token) {
          api.csrfToken = response.data.csrf_token;
        }
        return user;
      }
      return null;
    } catch (error) {
      this.currentUser = null;
      return null;
    }
  }

  async logout() {
    try {
      await api.logout();
      this.currentUser = null;
      api.csrfToken = null;
      this.cache = { barang: [], kategori: [], merek: [], supplier: [], lastFetch: {} };
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser || { id: 1, username: 'guest', nama: 'Guest', name: 'Guest', role: 'Owner' };
  }

  setCurrentUser(user) {
    this.currentUser = user;
  }

  // ============================================
  // Getters with API
  // ============================================
  
  getUsers() {
    // For role switcher - kept for compatibility
    return [
      { id: 1, username: 'owner', name: 'Owner Toko', role: 'Owner' },
      { id: 2, username: 'admin', name: 'Admin Toko', role: 'Admin' }
    ];
  }

  async getKategori(forceRefresh = false) {
    if (!forceRefresh && this.cache.kategori.length > 0) {
      return this.cache.kategori;
    }
    try {
      const response = await api.getKategori();
      if (response.success) {
        this.cache.kategori = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get kategori error:', error);
      return [];
    }
  }

  async getMerek(forceRefresh = false) {
    if (!forceRefresh && this.cache.merek.length > 0) {
      return this.cache.merek;
    }
    try {
      const response = await api.getMerek();
      if (response.success) {
        this.cache.merek = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get merek error:', error);
      return [];
    }
  }

  // --- Kategori & Merek CRUD (tambah/edit/hapus) ---
  async _mutateMaster(apiFn, cacheKey, errLabel) {
    try {
      const response = await apiFn();
      if (response.success) {
        this.cache[cacheKey] = []; // invalidate agar daftar refresh
        return response.data ?? true;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error(errLabel, error);
      throw error;
    }
  }

  async createKategori(data) { return this._mutateMaster(() => api.createKategori(data), 'kategori', 'Create kategori error:'); }
  async updateKategori(id, data) { return this._mutateMaster(() => api.updateKategori(id, data), 'kategori', 'Update kategori error:'); }
  async deleteKategori(id) { return this._mutateMaster(() => api.deleteKategori(id), 'kategori', 'Delete kategori error:'); }
  async createMerek(data) { return this._mutateMaster(() => api.createMerek(data), 'merek', 'Create merek error:'); }
  async updateMerek(id, data) { return this._mutateMaster(() => api.updateMerek(id, data), 'merek', 'Update merek error:'); }
  async deleteMerek(id) { return this._mutateMaster(() => api.deleteMerek(id), 'merek', 'Delete merek error:'); }

  async getSupplier(forceRefresh = false) {
    if (!forceRefresh && this.cache.supplier.length > 0) {
      return this.cache.supplier;
    }
    try {
      const response = await api.getSupplier();
      if (response.success) {
        this.cache.supplier = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get supplier error:', error);
      return [];
    }
  }

  async getBarang(forceRefresh = false) {
    if (!forceRefresh && this.cache.barang.length > 0) {
      return this.cache.barang;
    }
    try {
      const response = await api.getBarang();
      if (response.success) {
        this.cache.barang = response.data;
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get barang error:', error);
      return [];
    }
  }

  async getPembelian() {
    try {
      const response = await api.getPembelian();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Get pembelian error:', error);
      return [];
    }
  }

  async getHutang() {
    try {
      const response = await api.getHutang();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Get hutang error:', error);
      return [];
    }
  }

  async getTransaksi() {
    try {
      const response = await api.getTransaksi();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Get transaksi error:', error);
      return [];
    }
  }

  async getTransaksiById(id) {
    try {
      const response = await api.getTransaksiById(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get transaksi detail error:', error);
      return null;
    }
  }

  // ============================================
  // Laporan Owner (server-side aggregation)
  // ============================================

  async getLaporanPenjualanHarian(tanggal) {
    try {
      const response = await api.getLaporanPenjualanHarian(tanggal);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Laporan penjualan error:', error);
      return null;
    }
  }

  async getLaporanTerlaris(dateFrom, dateTo, sort = 'quantity') {
    try {
      const response = await api.getLaporanTerlaris(dateFrom, dateTo, sort);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Laporan terlaris error:', error);
      return null;
    }
  }

  async getLaporanStokMenipis() {
    try {
      const response = await api.getLaporanStokMenipis();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Laporan stok menipis error:', error);
      return [];
    }
  }

  async getLaporanKasHarian(tanggal) {
    try {
      const response = await api.getLaporanKasHarian(tanggal);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Laporan kas error:', error);
      return null;
    }
  }

  // ============================================
  // CRUD Barang (kept for compatibility, now using API)
  // ============================================
  
  async addBarang(barangData) {
    try {
      const response = await api.createBarang(barangData);
      if (response.success) {
        this.cache.barang = []; // Clear cache
        return { id: response.data.id, ...barangData };
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Add barang error:', error);
      throw error;
    }
  }

  async updateBarang(id, barangData) {
    try {
      const response = await api.updateBarang(id, barangData);
      if (response.success) {
        this.cache.barang = []; // Clear cache
        return true;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Update barang error:', error);
      throw error;
    }
  }

  async deleteBarang(id) {
    try {
      const response = await api.deleteBarang(id);
      if (response.success) {
        this.cache.barang = []; // Clear cache
        return true;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Delete barang error:', error);
      throw error;
    }
  }

  // ============================================
  // CRUD Supplier
  // ============================================
  
  async addSupplier(data) {
    try {
      const response = await api.createSupplier(data);
      if (response.success) {
        this.cache.supplier = []; // Clear cache
        return { id: response.data.id, ...data };
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Add supplier error:', error);
      throw error;
    }
  }

  async updateSupplier(id, data) {
    try {
      const response = await api.updateSupplier(id, data);
      if (response.success) {
        this.cache.supplier = []; // Clear cache
        return true;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Update supplier error:', error);
      throw error;
    }
  }

  async deleteSupplier(id) {
    try {
      const response = await api.deleteSupplier(id);
      if (response.success) {
        this.cache.supplier = []; // Clear cache
        return true;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Delete supplier error:', error);
      throw error;
    }
  }

  // ============================================
  // POS Checkout Engine
  // ============================================
  
  async processPOSTransaction(txData) {
    try {
      // Prepare transaction data for API
      const apiData = {
        items: txData.cartItems.map(item => ({
          barang_id: item.id,
          jumlah: item.qty
        })),
        diskon_tipe: txData.discountType,
        diskon_nilai: txData.discountValue,
        diskon_amount: txData.discountAmount,
        metode_bayar: txData.paymentMethod,
        jumlah_bayar: txData.paidAmount
      };

      // Idempotency: cegah double submit (double-click / retry jaringan)
      if (txData.idempotencyKey) {
        apiData.idempotency_key = txData.idempotencyKey;
      }

      // Kredit: kirim data pelanggan + uang muka
      if (txData.paymentMethod === 'Kredit') {
        apiData.pelanggan_nama = txData.pelangganNama;
        apiData.pelanggan_kontak = txData.pelangganKontak;
        apiData.uang_muka = txData.paidAmount;
        apiData.dp_metode_bayar = txData.dpMetodeBayar || 'Tunai';
      }

      const response = await api.createTransaksi(apiData);
      
      if (response.success) {
        // Clear cache
        this.cache.barang = [];
        
        // Return formatted transaction for receipt
        return {
          id: response.data.id,
          nomor: response.data.nomor,
          tanggal: response.data.tanggal,
          kasir_id: this.currentUser?.id || 1,
          kasir_nama: this.currentUser?.nama || 'Kasir',
          subtotal: txData.cartItems.reduce((acc, i) => acc + (i.harga_jual * i.qty), 0),
          diskon_tipe: txData.discountType,
          diskon_nilai: txData.discountValue,
          diskon_amount: txData.discountAmount,
          total: response.data.total,
          metode_bayar: txData.paymentMethod,
          jumlah_bayar: txData.paidAmount,
          kembalian: response.data.kembalian,
          sisa_piutang: response.data.sisa_piutang ?? 0,
          pelanggan_nama: txData.pelangganNama || null,
          items: txData.cartItems.map(i => ({
            barang_id: i.id,
            nama: i.nama,
            jumlah: i.qty,
            harga_jual: i.harga_jual,
            harga_beli: i.harga_beli,
            subtotal: i.harga_jual * i.qty
          }))
        };
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('POS transaction error:', error);
      throw error;
    }
  }

  // ============================================
  // Pembelian & Debt Engine
  // ============================================
  
  async addPembelian(data) {
    try {
      const response = await api.createPembelian(data);
      if (response.success) {
        this.cache.barang = []; // Clear cache (stok changed)
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Add pembelian error:', error);
      throw error;
    }
  }

  async payHutang(hutangId, amount, paymentMethod) {
    try {
      const response = await api.payHutang({
        hutang_id: hutangId,
        jumlah_bayar: amount,
        metode_bayar: paymentMethod,
        tanggal_bayar: todayLocal()
      });
      
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Pay hutang error:', error);
      throw error;
    }
  }

  // ============================================
  // Piutang Pelanggan (Kredit)
  // ============================================

  async getPiutang() {
    try {
      const response = await api.getPiutang();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Get piutang error:', error);
      return [];
    }
  }

  async payPiutang(piutangId, amount, paymentMethod) {
    try {
      const response = await api.payPiutang({
        piutang_id: piutangId,
        jumlah_bayar: amount,
        metode_bayar: paymentMethod,
        tanggal_bayar: todayLocal()
      });

      if (response.success) {
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Pay piutang error:', error);
      throw error;
    }
  }

  // ============================================
  // Dashboard & Metrics Queries
  // ============================================
  
  async getDashboardMetrics() {
    try {
      const response = await api.getDashboardMetrics();
      if (response.success) {
        const data = response.data;
        
        // Get chart data
        const chartResponse = await api.getChart7Hari();
        const chartData = chartResponse.success ? chartResponse.data : [];
        
        return {
          totalTransactionsToday: data.total_transaksi,
          totalOmzetToday: data.total_omzet,
          totalLabaKotorToday: data.laba_kotor,
          lowStockCount: data.stok_menipis_count,
          lowStockItems: data.low_stock_items || [],
          chartData: chartData,
          topProducts: data.top_products || [],
          activeDebts: data.active_debts || [],
          piutangAktifCount: data.piutang_aktif_count || 0,
          piutangAktifTotal: data.piutang_aktif_total || 0
        };
      }
      throw new Error('Failed to get dashboard metrics');
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      // Return empty data on error
      return {
        totalTransactionsToday: 0,
        totalOmzetToday: 0,
        totalLabaKotorToday: 0,
        lowStockCount: 0,
        lowStockItems: [],
        chartData: [],
        topProducts: [],
        activeDebts: [],
        piutangAktifCount: 0,
        piutangAktifTotal: 0
      };
    }
  }

  // Kept for compatibility - no longer used
  resetToDefault() {
    if (confirm('Fitur reset tidak tersedia saat menggunakan database server. Data hanya bisa direset dari database.')) {
      return;
    }
  }

  saveBarangList() {} // No-op
  saveSupplierList() {} // No-op
  saveKategoriList() {} // No-op
  saveMerekList() {} // No-op
  savePembelianList() {} // No-op
  saveHutangList() {} // No-op
  saveTransaksiList() {} // No-op
}

export const store = new Store();

// Reset state saat API mengembalikan 401 (session expired) — tanpa circular import
api.onUnauthorized = () => {
  store.currentUser = null;
  store.cache = { barang: [], kategori: [], merek: [], supplier: [], lastFetch: {} };
};
