// Histori Penjualan View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc, num } from '../utils/helpers.js';
import { renderReceiptModal } from '../components/receipt.js';

// Ambil detail transaksi (dengan items) dari server lalu tampilkan struk.
// Daftar histori hanya berisi header tanpa items, jadi fetch detail dulu.
async function reprintTransaksi(id) {
  const tx = await store.getTransaksiById(id);
  if (tx) {
    renderReceiptModal(tx);
  } else {
    showToast('Gagal memuat detail transaksi.', 'error');
  }
}

let searchTxNo = '';
let cachedTxList = [];

export async function renderTransaksi() {
  cachedTxList = await store.getTransaksi();

  const filtered = cachedTxList.filter(t =>
    t.nomor.toLowerCase().includes(searchTxNo.toLowerCase())
  );

  const rowsHtml = filtered.length > 0 ? filtered.map(t => `
    <tr>
      <td><span class="font-mono" style="font-weight:700;">${esc(t.nomor)}</span></td>
      <td>📅 ${t.tanggal}</td>
      <td><strong>${esc(t.kasir_nama) || 'Kasir'}</strong></td>
      <td class="font-mono text-center">${(t.items || []).reduce((a, b) => a + num(b.jumlah), 0)} Item</td>
      <td class="font-mono" style="font-weight:700; color:var(--cobalt-700);">Rp ${num(t.total).toLocaleString('id-ID')}</td>
      <td><span class="badge badge-slate">${esc(t.metode_bayar)}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary reprint-tx-btn" data-id="${t.id}">🖨️ Cetak Struk</button>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="7" class="text-center" style="padding:30px; color:var(--slate-400);">Tidak ada histori transaksi penjualan</td></tr>`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">🧾 Histori Transaksi Penjualan</h2>
          <p style="font-size:13px; color:var(--slate-500);">Arsip bukti transaksi penjualan kasir & pencetakan ulang struk.</p>
        </div>
        <div class="table-search">
          <input type="text" id="tx-search-input" placeholder="Cari No. TRX..." value="${esc(searchTxNo)}">
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No. Transaksi</th>
              <th>Tanggal & Waktu</th>
              <th>Kasir</th>
              <th class="text-center">Total Item</th>
              <th>Total Omzet</th>
              <th>Metode Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('tx-search-input')?.addEventListener('input', (e) => {
      searchTxNo = e.target.value;
      // Update only the table body, no full re-render
      const tbody = document.querySelector('.data-table tbody');
      if (!tbody) return;
      const filtered = cachedTxList.filter(t =>
        t.nomor.toLowerCase().includes(searchTxNo.toLowerCase())
      );
      tbody.innerHTML = filtered.length > 0 ? filtered.map(t => `
        <tr>
          <td><span class="font-mono" style="font-weight:700;">${esc(t.nomor)}</span></td>
          <td>📅 ${t.tanggal}</td>
          <td><strong>${esc(t.kasir_nama) || 'Kasir'}</strong></td>
          <td class="font-mono text-center">${(t.items || []).reduce((a,b)=>a+num(b.jumlah),0)} Item</td>
          <td class="font-mono" style="font-weight:700;color:var(--cobalt-700);">Rp ${num(t.total).toLocaleString('id-ID')}</td>
          <td><span class="badge badge-slate">${esc(t.metode_bayar)}</span></td>
          <td><button class="btn btn-sm btn-secondary reprint-tx-btn" data-id="${t.id}">🖨️ Cetak Struk</button></td>
        </tr>`).join('') :
        `<tr><td colspan="7" class="text-center" style="padding:30px;color:var(--slate-400);">Tidak ada histori transaksi penjualan</td></tr>`;
      // Re-attach reprint events
      document.querySelectorAll('.reprint-tx-btn').forEach(btn => {
        btn.onclick = () => reprintTransaksi(Number(btn.dataset.id));
      });
    });

    document.querySelectorAll('.reprint-tx-btn').forEach(btn => {
      btn.onclick = () => reprintTransaksi(Number(btn.dataset.id));
    });
  }, 0);

  return html;
}
