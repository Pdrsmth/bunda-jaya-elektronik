/**
 * API Client
 * Handles all HTTP requests to backend
 */

// Use Vite proxy - no need for full URL in development
const API_BASE_URL = '/api';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        // Callback saat server mengembalikan 401 (di-set oleh store.js untuk
        // mereset state tanpa circular import)
        this.onUnauthorized = null;
        // CSRF token per sesi — diisi setelah login / check session
        this.csrfToken = null;
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const method = (options.method || 'GET').toUpperCase();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        // Kirim CSRF token untuk request state-changing
        if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }
        const config = {
            credentials: 'include', // Important: include session cookie
            headers,
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();

            if (response.status === 401) {
                // Session expired / belum login → reset state lalu kembali ke login
                if (typeof this.onUnauthorized === 'function') {
                    this.onUnauthorized();
                }
                if (window.location.hash !== '#/login') {
                    window.location.hash = '#/login';
                }
                throw new Error(data.message || 'Sesi berakhir. Silakan login ulang.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ============================================
    // Authentication
    // ============================================
    
    async login(username, password) {
        return this.request('/auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.request('/auth.php?action=logout', {
            method: 'POST'
        });
    }

    async checkSession() {
        return this.request('/auth.php?action=check');
    }

    // ============================================
    // Barang
    // ============================================
    
    async getBarang() {
        return this.request('/barang.php');
    }

    async getBarangById(id) {
        return this.request(`/barang.php?id=${id}`);
    }

    async createBarang(data) {
        return this.request('/barang.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBarang(id, data) {
        return this.request(`/barang.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteBarang(id) {
        return this.request(`/barang.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // Kategori & Merek
    // ============================================
    
    async getKategori() {
        return this.request('/kategori.php');
    }

    async createKategori(data) {
        return this.request('/kategori.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateKategori(id, data) {
        return this.request(`/kategori.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteKategori(id) {
        return this.request(`/kategori.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    async getMerek() {
        return this.request('/merek.php');
    }

    async createMerek(data) {
        return this.request('/merek.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateMerek(id, data) {
        return this.request(`/merek.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteMerek(id) {
        return this.request(`/merek.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // Supplier
    // ============================================
    
    async getSupplier() {
        return this.request('/supplier.php');
    }

    async createSupplier(data) {
        return this.request('/supplier.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateSupplier(id, data) {
        return this.request(`/supplier.php?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteSupplier(id) {
        return this.request(`/supplier.php?id=${id}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // Users (Owner only) & Password
    // ============================================

    async changePassword(data) {
        return this.request('/auth.php?action=change-password', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getUsers() {
        return this.request('/users.php');
    }

    async createUser(data) {
        return this.request('/users.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUser(data) {
        return this.request('/users.php', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // ============================================
    // Transaksi (POS)
    // ============================================
    
    async getTransaksi() {
        return this.request('/transaksi.php');
    }

    async getTransaksiById(id) {
        return this.request(`/transaksi.php?id=${id}`);
    }

    async createTransaksi(data) {
        return this.request('/transaksi.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getTransaksiHistory(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/transaksi.php?action=history&${params}`);
    }

    // ============================================
    // Pembelian
    // ============================================
    
    async getPembelian() {
        return this.request('/pembelian.php');
    }

    async createPembelian(data) {
        return this.request('/pembelian.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ============================================
    // Hutang
    // ============================================
    
    async getHutang() {
        return this.request('/hutang.php');
    }

    async payHutang(data) {
        return this.request('/hutang.php?action=bayar', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ============================================
    // Piutang Pelanggan (Kredit)
    // ============================================

    async getPiutang() {
        return this.request('/piutang.php');
    }

    async getPiutangById(id) {
        return this.request(`/piutang.php?id=${id}`);
    }

    async payPiutang(data) {
        return this.request('/piutang.php?action=bayar', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ============================================
    // Dashboard & Laporan
    // ============================================
    
    async getDashboardMetrics() {
        return this.request('/dashboard.php?action=metrics');
    }

    async getChart7Hari() {
        return this.request('/dashboard.php?action=chart-7hari');
    }

    async getLaporanPenjualanHarian(tanggal) {
        return this.request(`/dashboard.php?action=penjualan-harian&tanggal=${tanggal}`);
    }

    async getLaporanTerlaris(dateFrom, dateTo, sort = 'quantity') {
        return this.request(`/dashboard.php?action=terlaris&date_from=${dateFrom}&date_to=${dateTo}&sort=${sort}`);
    }

    async getLaporanStokMenipis() {
        return this.request('/dashboard.php?action=stok-menipis');
    }

    async getLaporanKasHarian(tanggal) {
        return this.request(`/dashboard.php?action=kas-harian&tanggal=${tanggal}`);
    }
}

export const api = new ApiClient();
