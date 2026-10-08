// Manajemen Hutang Supplier View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc, num } from '../utils/helpers.js';
import { todayLocal } from '../utils/helpers.js';

let cachedHutangList = [];
let cachedSupplierList = [];
let cachedPembelianList = [];

export async function renderHutang() {
  cachedHutangList = await store.getHutang();
  cachedSupplierList = await store.getSupplier();
  cachedPembelianList = await store.getPembelian();

  const hutangList = cachedHutangList;
  const supplierList = cachedSupplierList;
  const pembelianList = cachedPembelianList;
  const todayStr = todayLocal();

  const rowsHtml = hutangList.length > 0 ? hutangList.map(h => {
    const supp = supplierList.find(s => s.id === h.supplier_id);
    const buy = pembelianList.find(p => p.id === h.pembelian_id);
    const isLunas = h.status === 'Lunas';
    const isOverdue = !isLunas && h.jatuh_tempo && new Date(h.jatuh_tempo) < new Date(todayStr);
    const rowClass = isOverdue ? 'row-pink-alert' : (!isLunas ? 'row-amber-alert' : '');

    return `
      <tr class="${rowClass}">
        <td><strong>${supp ? esc(supp.nama) : '-'}</strong></td>
        <td><span class="font-mono" style="font-size:12px;">${buy ? buy.nomor : '-'}</span></td>
        <td class="font-mono">Rp ${num(h.total_hutang).toLocaleString('id-ID')}</td>
        <td class="font-mono" style="color:var(--emerald-600);">Rp ${num(h.sudah_dibayar).toLocaleString('id-ID')}</td>
        <td class="font-mono" style="font-weight:700; color:var(--crimson-600);">Rp ${num(h.sisa_hutang).toLocaleString('id-ID')}</td>
        <td>
          <span class="badge ${isLunas ? 'badge-emerald' : (isOverdue ? 'badge-crimson' : 'badge-amber')}">
            ${isLunas ? '✓ Lunas' : (isOverdue ? '🚨 Terlambat' : '⏳ ' + h.jatuh_tempo)}
          </span>
        </td>
        <td>
          ${!isLunas
            ? `<button class="btn btn-sm btn-primary pay-debt-btn" data-id="${h.id}">💳 Bayar</button>`
            : `<span class="badge badge-emerald">Lunas</span>`
          }
        </td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="7" class="text-center" style="padding:30px; color:var(--slate-400);">Belum ada catatan hutang supplier</td></tr>`;

  const totalHutangAktif = hutangList.filter(h => h.status !== 'Lunas').reduce((a, b) => a + num(b.sisa_hutang), 0);

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">💳 Manajemen Hutang Supplier</h2>
          <p style="font-size:13px; color:var(--slate-500);">Pemantauan tagihan pembelian tempo & pencatatan cicilan/pelunasan.</p>
        </div>
        <div style="background:var(--crimson-50); border:1px solid var(--crimson-100); padding:10px 18px; border-radius:var(--radius-lg); text-align:right;">
          <div style="font-size:11px; font-weight:700; color:var(--crimson-700); text-transform:uppercase;">TOTAL HUTANG AKTIF</div>
          <div class="font-mono" style="font-size:22px; font-weight:800; color:var(--crimson-700);">Rp ${num(totalHutangAktif).toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>No. Pembelian</th>
              <th>Total Awal</th>
              <th>Sudah Dibayar</th>
              <th>Sisa Hutang</th>
              <th>Status / Jatuh Tempo</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div id="debt-modal" class="modal-backdrop"></div>
  `;

  setTimeout(() => {
    document.querySelectorAll('.pay-debt-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.id);
        const debt = cachedHutangList.find(h => h.id === id);
        if (debt) openPayDebtModal(debt);
      };
    });
  }, 0);

  return html;
}

function openPayDebtModal(debt) {
  const modalContainer = document.getElementById('debt-modal');
  if (!modalContainer) return;

  const supp = cachedSupplierList.find(s => s.id === debt.supplier_id);
  const buy = cachedPembelianList.find(p => p.id === debt.pembelian_id);

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">Bayar Hutang Supplier</h3>
        <button class="modal-close-btn" id="debt-close-x">&times;</button>
      </div>
      <form id="pay-debt-form">
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
          <div style="background:var(--slate-100); padding:12px; border-radius:var(--radius-md); font-size:13px; display:flex; flex-direction:column; gap:4px;">
            <div><strong>Supplier:</strong> ${supp ? esc(supp.nama) : '-'}</div>
            <div><strong>No. Pembelian:</strong> ${buy ? buy.nomor : '-'}</div>
            <div><strong>Total Hutang Awal:</strong> Rp ${num(debt.total_hutang).toLocaleString('id-ID')}</div>
            <div><strong>Sudah Dibayar:</strong> Rp ${num(debt.sudah_dibayar).toLocaleString('id-ID')}</div>
            <div style="font-size:15px; font-weight:800; color:var(--crimson-600); margin-top:4px;">
              SISA HUTANG: Rp ${num(debt.sisa_hutang).toLocaleString('id-ID')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Jumlah Pembayaran Rp <span class="required">*</span></label>
            <input type="number" id="pay-debt-amount" class="form-control font-mono" max="${debt.sisa_hutang}" value="${debt.sisa_hutang}" required>
            <span class="form-helper">Bisa bayar cicilan sebagian atau pelunasan penuh</span>
          </div>

          <div class="form-group">
            <label class="form-label">Metode Pembayaran <span class="required">*</span></label>
            <select id="pay-debt-method" class="form-control">
              <option value="Transfer">Transfer Bank</option>
              <option value="Tunai">Tunai Kas</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="debt-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Proses Bayar Hutang</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('debt-close-x').onclick = closeModal;
  document.getElementById('debt-cancel-btn').onclick = closeModal;

  document.getElementById('pay-debt-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return; // cegah double submit
    const amt = Number(document.getElementById('pay-debt-amount').value);
    const method = document.getElementById('pay-debt-method').value;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';
      await store.payHutang(debt.id, amt, method);
      showToast(`Pembayaran hutang sebesar Rp ${num(amt).toLocaleString('id-ID')} berhasil disimpan!`, 'success');
      closeModal();
      const contentArea = document.querySelector('.app-content');
      if (contentArea) {
        renderHutang().then(h => { contentArea.innerHTML = h; });
      }
    } catch (err) {
      showToast(err.message || 'Gagal memproses pembayaran.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Pembayaran';
    }
  };
}
