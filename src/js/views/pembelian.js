// Stok Masuk (Pembelian Supplier) View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { generateIdempotencyKey, esc, num } from '../utils/helpers.js';
import { todayLocal } from '../utils/helpers.js';

let purchaseFormItems = [];
let cachedSupplierList = [];
let cachedBarangList = [];

export async function renderPembelian() {
  const pembelianList = await store.getPembelian();
  const supplierList = await store.getSupplier();
  
  // Cache them
  cachedSupplierList = supplierList;
  cachedBarangList = await store.getBarang();

  const rowsHtml = pembelianList.length > 0 ? pembelianList.map(p => {
    const supp = supplierList.find(s => s.id === p.supplier_id);
    const isLunas = p.status_bayar === 'Lunas';

    return `
      <tr>
        <td><span class="font-mono" style="font-weight:700;">${p.nomor}</span></td>
        <td>📅 ${p.tanggal}</td>
        <td><strong>${supp ? esc(supp.nama) : '-'}</strong></td>
        <td class="font-mono text-center"><strong>${(p.items || []).reduce((a,b)=>a+num(b.jumlah),0)}</strong> Item</td>
        <td class="font-mono" style="font-weight:700; color:var(--cobalt-700);">Rp ${num(p.total).toLocaleString('id-ID')}</td>
        <td>
          <span class="badge ${isLunas ? 'badge-emerald' : 'badge-amber'}">
            ${isLunas ? '✓ Lunas (' + esc(p.metode_bayar || 'Tunai') + ')' : '⏳ Hutang (Jt: ' + esc(p.jatuh_tempo) + ')'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary view-buy-detail-btn" data-id="${p.id}">📄 Detail</button>
        </td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="7" class="text-center" style="padding:30px; color:var(--slate-400);">Belum ada catatan stok masuk pembelian</td></tr>`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">📥 Stok Masuk (Pembelian Supplier)</h2>
          <p style="font-size:13px; color:var(--slate-500);">Pencatatan pembelian barang dari distributor untuk penambahan stok toko.</p>
        </div>
        <button id="add-buy-btn" class="btn btn-primary btn-lg">➕ Catat Pembelian Baru</button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No. Pembelian</th>
              <th>Tanggal</th>
              <th>Supplier</th>
              <th class="text-center">Total Item</th>
              <th>Total Nominal</th>
              <th>Status Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <div id="buy-modal" class="modal-backdrop"></div>
  `;

  setTimeout(() => {
    document.getElementById('add-buy-btn')?.addEventListener('click', () => {
      openBuyModal();
    });

    document.querySelectorAll('.view-buy-detail-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const list = await store.getPembelian();
        const buy = list.find(p => p.id === id);
        if (buy) openBuyDetailModal(buy);
      };
    });
  }, 0);

  return html;
}

function openBuyModal() {
  const modalContainer = document.getElementById('buy-modal');
  if (!modalContainer) return;

  const supplierList = cachedSupplierList;
  const barangList = cachedBarangList;
  purchaseFormItems = []; // Reset draft items

  const renderDraftItems = () => {
    const listEl = document.getElementById('buy-items-draft');
    if (!listEl) return;

    if (purchaseFormItems.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:16px; color:var(--slate-400); font-size:13px;">Belum ada barang ditambahkan ke daftar pembelian</div>`;
      document.getElementById('buy-total-val').innerText = 'Rp 0';
      return;
    }

    const total = purchaseFormItems.reduce((acc, i) => acc + (i.harga_beli * i.jumlah), 0);
    document.getElementById('buy-total-val').innerText = `Rp ${num(total).toLocaleString('id-ID')}`;

    listEl.innerHTML = purchaseFormItems.map((item, idx) => {
      const b = barangList.find(x => x.id === Number(item.barang_id));
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--slate-100); border-radius:var(--radius-md); font-size:13px;">
          <div>
            <strong>${b ? esc(b.nama) : '-'}</strong>
            <div class="font-mono" style="color:var(--slate-600); font-size:11px;">
              ${item.jumlah} Unit x Rp ${Number(item.harga_beli).toLocaleString('id-ID')}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="font-mono" style="font-weight:700;">Rp ${num((item.jumlah * item.harga_beli)).toLocaleString('id-ID')}</span>
            <button type="button" class="btn btn-sm btn-danger remove-buy-item" data-idx="${idx}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.remove-buy-item').forEach(btn => {
      btn.onclick = () => {
        purchaseFormItems.splice(Number(btn.dataset.idx), 1);
        renderDraftItems();
      };
    });
  };

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 750px;">
      <div class="modal-header">
        <h3 class="modal-title">Catat Stok Masuk (Pembelian Baru)</h3>
        <button class="modal-close-btn" id="buy-close-x">&times;</button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
        <form id="buy-form" style="display:contents;">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Supplier <span class="required">*</span></label>
            <select id="buy-supplier" class="form-control" required>
              <option value="">-- Pilih Supplier --</option>
              ${supplierList.map(s => `<option value="${s.id}">${esc(s.nama)}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tanggal Pembelian <span class="required">*</span></label>
            <input type="date" id="buy-tanggal" class="form-control font-mono" value="${todayLocal()}" required>
          </div>
        </div>

        <!-- Section Input Add Item -->
        <div style="border:1px solid var(--slate-200); border-radius:var(--radius-md); padding:14px; background:var(--slate-50);">
          <div style="font-weight:700; font-size:13px; margin-bottom:8px; color:var(--slate-800);">➕ Tambah Item Produk ke Daftar Pembelian</div>
          <div style="display:grid; grid-template-columns: 2fr 1fr 1fr auto; gap:8px; align-items:end;">
            <div>
              <label class="form-label" style="font-size:11px;">Pilih Barang</label>
              <select id="item-barang-select" class="form-control" style="padding:6px 10px; font-size:13px;">
                <option value="">-- Pilih Barang --</option>
                ${barangList.map(b => `<option value="${b.id}">${esc(b.nama)} (Stok: ${b.stok})</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="form-label" style="font-size:11px;">Jumlah Beli</label>
              <input type="number" id="item-qty-input" class="form-control font-mono" style="padding:6px 10px; font-size:13px;" min="1" value="1">
            </div>

            <div>
              <label class="form-label" style="font-size:11px;">Harga Beli Rp/Unit</label>
              <input type="number" id="item-harga-input" class="form-control font-mono" style="padding:6px 10px; font-size:13px;" placeholder="0">
            </div>

            <button type="button" id="add-item-to-list-btn" class="btn btn-secondary" style="padding:7px 12px;">+ Tambah</button>
          </div>
        </div>

        <!-- Draft List Items -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-weight:700; font-size:13px; color:var(--slate-800);">Daftar Barang Dibeli:</div>
          <div id="buy-items-draft" style="display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto;"></div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--cobalt-50); padding:12px; border-radius:var(--radius-md); border:1px solid var(--cobalt-100);">
          <span style="font-weight:700; color:var(--cobalt-700);">TOTAL PEMBELIAN:</span>
          <span id="buy-total-val" class="font-mono" style="font-size:22px; font-weight:800; color:var(--cobalt-700);">Rp 0</span>
        </div>

        <!-- Status Pembayaran -->
        <div class="form-grid" style="border-top:1px solid var(--slate-200); padding-top:14px;">
          <div class="form-group">
            <label class="form-label">Status Bayar <span class="required">*</span></label>
            <div style="display:flex; gap:16px; margin-top:4px;">
              <label style="display:flex; align-items:center; gap:6px; font-weight:600; cursor:pointer;">
                <input type="radio" name="status_bayar" value="Lunas" checked> 🟢 Lunas (Bayar Tunai/Transfer)
              </label>
              <label style="display:flex; align-items:center; gap:6px; font-weight:600; cursor:pointer;">
                <input type="radio" name="status_bayar" value="Hutang"> 🔴 Hutang Supplier
              </label>
            </div>
          </div>

          <div class="form-group" id="group-metode">
            <label class="form-label">Metode Pembayaran</label>
            <select id="buy-metode" class="form-control">
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          <div class="form-group" id="group-jatuh-tempo" style="display:none;">
            <label class="form-label">Tanggal Jatuh Tempo Hutang <span class="required">*</span></label>
            <input type="date" id="buy-jatuh-tempo" class="form-control font-mono">
          </div>
        </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="buy-cancel-btn">Batal</button>
        <button type="submit" form="buy-form" class="btn btn-primary">Simpan Stok Masuk</button>
      </div>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('buy-close-x').onclick = closeModal;
  document.getElementById('buy-cancel-btn').onclick = closeModal;

  // Auto-fill price when item selected
  document.getElementById('item-barang-select').onchange = (e) => {
    const bId = Number(e.target.value);
    const b = barangList.find(x => x.id === bId);
    if (b) {
      document.getElementById('item-harga-input').value = b.harga_beli;
    }
  };

  // Add Item Click
  document.getElementById('add-item-to-list-btn').onclick = () => {
    const barangId = document.getElementById('item-barang-select').value;
    const qty = Number(document.getElementById('item-qty-input').value);
    const harga = Number(document.getElementById('item-harga-input').value);

    if (!barangId || qty <= 0 || harga < 0) {
      showToast('Pilih barang, masukkan jumlah > 0 dan harga beli valid!', 'error');
      return;
    }

    purchaseFormItems.push({ barang_id: Number(barangId), jumlah: qty, harga_beli: harga, subtotal: qty * harga });
    renderDraftItems();
  };

  // Toggle status bayar radio
  document.querySelectorAll('input[name="status_bayar"]').forEach(radio => {
    radio.onchange = (e) => {
      const val = e.target.value;
      if (val === 'Lunas') {
        document.getElementById('group-metode').style.display = 'block';
        document.getElementById('group-jatuh-tempo').style.display = 'none';
      } else {
        document.getElementById('group-metode').style.display = 'none';
        document.getElementById('group-jatuh-tempo').style.display = 'block';
      }
    };
  });

  // Submit Form (dengan guard anti double-submit)
  let isSavingPembelian = false;
  document.getElementById('buy-form').onsubmit = async (e) => {
    e.preventDefault();
    if (isSavingPembelian) return;
    const supplier_id = document.getElementById('buy-supplier').value;
    const tanggal = document.getElementById('buy-tanggal').value;
    const status_bayar = document.querySelector('input[name="status_bayar"]:checked').value;
    const metode_bayar = document.getElementById('buy-metode').value;
    const jatuh_tempo = document.getElementById('buy-jatuh-tempo').value;

    if (!supplier_id) {
      showToast('Pilih supplier terlebih dahulu!', 'error');
      return;
    }
    if (purchaseFormItems.length === 0) {
      showToast('Tambahkan minimal 1 item barang ke daftar pembelian!', 'error');
      return;
    }
    if (status_bayar === 'Hutang' && !jatuh_tempo) {
      showToast('Tentukan tanggal jatuh tempo hutang supplier!', 'error');
      return;
    }

    try {
      isSavingPembelian = true;
      const saveBtn = document.querySelector('button[form="buy-form"]');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Menyimpan...';
      }
      const buy = await store.addPembelian({
        supplier_id,
        tanggal,
        status_bayar,
        metode_bayar,
        jatuh_tempo,
        idempotency_key: generateIdempotencyKey(),
        items: purchaseFormItems
      });

      showToast(`Stok Masuk ${buy.nomor || ''} berhasil disimpan & stok bertambah!`, 'success');
      closeModal();
      const contentArea = document.querySelector('.app-content');
      if (contentArea) contentArea.innerHTML = await renderPembelian();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      isSavingPembelian = false;
      const saveBtn = document.querySelector('button[form="buy-form"]');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan Stok Masuk';
      }
    }
  };
}

function openBuyDetailModal(buy) {
  const modalContainer = document.getElementById('buy-modal');
  if (!modalContainer) return;

  const supp = cachedSupplierList.find(s => s.id === buy.supplier_id);
  const barangList = cachedBarangList;

  const itemsHtml = (buy.items || []).map(i => {
    const b = barangList.find(x => x.id === i.barang_id);
    return `
      <tr>
        <td>${b ? esc(b.nama) : 'Barang'}</td>
        <td class="font-mono text-center">${i.jumlah} Unit</td>
        <td class="font-mono">Rp ${num(i.harga_beli).toLocaleString('id-ID')}</td>
        <td class="font-mono" style="font-weight:700;">Rp ${num(i.subtotal).toLocaleString('id-ID')}</td>
      </tr>
    `;
  }).join('');

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Detail Pembelian ${buy.nomor}</h3>
        <button class="modal-close-btn" id="buy-detail-close">&times;</button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:var(--slate-100); padding:12px; border-radius:var(--radius-md); font-size:13px;">
          <div><strong>Supplier:</strong> ${supp ? esc(supp.nama) : '-'}</div>
          <div><strong>Tanggal:</strong> ${buy.tanggal}</div>
          <div><strong>Status Bayar:</strong> <span class="badge ${buy.status_bayar === 'Lunas' ? 'badge-emerald' : 'badge-amber'}">${buy.status_bayar}</span></div>
          <div><strong>Total Pembelian:</strong> <strong class="font-mono" style="color:var(--cobalt-700);">Rp ${num(buy.total).toLocaleString('id-ID')}</strong></div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th class="text-center">Jumlah</th>
              <th>Harga Beli</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="buy-detail-btn-close">Tutup</button>
      </div>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('buy-detail-close').onclick = closeModal;
  document.getElementById('buy-detail-btn-close').onclick = closeModal;
}
