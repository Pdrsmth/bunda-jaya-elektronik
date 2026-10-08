// Receipt Thermal Modal & Renderer Component

import { esc, num } from '../utils/helpers.js';
export function renderReceiptModal(tx) {
  let modalBackdrop = document.getElementById('receipt-modal');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'receipt-modal';
    modalBackdrop.className = 'modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  const itemsHtml = (tx.items || []).map(item => `
    <div style="margin-bottom:4px;">
      <div class="receipt-item-name">${esc(item.nama)}</div>
      <div class="receipt-item-calc">
        <span>${item.jumlah} x Rp ${num(item.harga_jual).toLocaleString('id-ID')}</span>
        <span>Rp ${num(item.subtotal).toLocaleString('id-ID')}</span>
      </div>
    </div>
  `).join('');

  const discountHtml = tx.diskon_amount > 0 ? `
    <div class="receipt-summary-line">
      <span>Diskon (${tx.diskon_tipe === 'Persen' ? tx.diskon_nilai + '%' : 'Nominal'}):</span>
      <span>- Rp ${num(tx.diskon_amount).toLocaleString('id-ID')}</span>
    </div>
  ` : '';

  modalBackdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 400px;">
      <div class="modal-header no-print">
        <h3 class="modal-title">Struk Penjualan</h3>
        <button class="modal-close-btn" id="close-receipt-btn">&times;</button>
      </div>
      <div class="modal-body" style="background-color: var(--slate-100);">
        <div class="receipt-preview-container" id="receipt-modal-content">
          <div class="receipt-header">
            <div class="receipt-store-title">TOKO BUNDA JAYA ELEKTRONIK</div>
            <div>Jl. Raya Ritel Elektronik No. 88, Kota</div>
            <div>Telp: (021) 5544-3322 / WA: 0812-3456-7890</div>
          </div>

          <div class="receipt-meta">
            <div class="receipt-meta-row"><span>No. TRX:</span> <strong>${esc(tx.nomor)}</strong></div>
            <div class="receipt-meta-row"><span>Tanggal:</span> <span>${tx.tanggal}</span></div>
            <div class="receipt-meta-row"><span>Kasir:</span> <span>${esc(tx.kasir_nama || 'Kasir')}</span></div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-items">
            ${itemsHtml}
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-summary-line">
            <span>Subtotal:</span>
            <span>Rp ${num(tx.subtotal).toLocaleString('id-ID')}</span>
          </div>
          ${discountHtml}
          <div class="receipt-summary-line total">
            <span>TOTAL:</span>
            <span>Rp ${num(tx.total).toLocaleString('id-ID')}</span>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-summary-line">
            <span>Metode Bayar:</span>
            <span>${esc(tx.metode_bayar)}</span>
          </div>
          <div class="receipt-summary-line">
            <span>Jumlah Bayar:</span>
            <span>Rp ${num(tx.jumlah_bayar).toLocaleString('id-ID')}</span>
          </div>
          <div class="receipt-summary-line">
            <span>Kembalian:</span>
            <span>Rp ${num(tx.kembalian).toLocaleString('id-ID')}</span>
          </div>

          ${tx.metode_bayar === 'Kredit' ? `
          <div class="receipt-divider"></div>
          <div class="receipt-summary-line">
            <span>Pelanggan:</span>
            <span>${esc(tx.pelanggan_nama) || '-'}</span>
          </div>
          <div class="receipt-summary-line">
            <span>Uang Muka (DP):</span>
            <span>Rp ${Number(tx.jumlah_bayar || 0).toLocaleString('id-ID')}</span>
          </div>
          <div class="receipt-summary-line total">
            <span>SISA PIUTANG:</span>
            <span>Rp ${Number(tx.sisa_piutang || 0).toLocaleString('id-ID')}</span>
          </div>
          <div style="font-size:10px; text-align:center; margin-top:4px; color:#64748b;">
            Kredit fleksibel — cicilan bebas, bayar kapan pun berapa pun
          </div>
          ` : ''}

          <div class="receipt-footer">
            <div>Terima Kasih Atas Kunjungan Anda!</div>
            <div>Barang yang sudah dibeli dapat ditukar max 3 hari (bawa struk & dus)</div>
          </div>
        </div>
      </div>
      <div class="modal-footer no-print">
        <button class="btn btn-secondary" id="cancel-receipt-btn">Tutup</button>
        <button class="btn btn-primary" id="print-receipt-action">🖨️ Cetak Struk (Print)</button>
      </div>
    </div>
  `;

  modalBackdrop.classList.add('active');

  // Event listeners
  document.getElementById('close-receipt-btn').onclick = () => modalBackdrop.classList.remove('active');
  document.getElementById('cancel-receipt-btn').onclick = () => modalBackdrop.classList.remove('active');
  document.getElementById('print-receipt-action').onclick = () => {
    window.print();
  };
}
