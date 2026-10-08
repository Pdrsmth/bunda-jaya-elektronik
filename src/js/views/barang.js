// Master Data Barang View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc, num } from '../utils/helpers.js';
import { openMasterModal } from './kategori-merek.js';

let barangSearch = '';
let selectedCategoryFilter = '';
let selectedMerekFilter = '';
let cachedBarangList = []; // Cache for sync access
let cachedKategoriList = []; // Cache for sync access
let cachedMerekList = []; // Cache for sync access

export async function renderBarang() {
  const barangList = await store.getBarang();
  const kategoriList = await store.getKategori();
  const merekList = await store.getMerek();
  
  // Cache them
  cachedBarangList = barangList;
  cachedKategoriList = kategoriList;
  cachedMerekList = merekList;

  const filtered = barangList.filter(b => {
    const matchCat = !selectedCategoryFilter || b.kategori_id === Number(selectedCategoryFilter);
    const matchMerek = !selectedMerekFilter || b.merek_id === Number(selectedMerekFilter);
    const matchSearch = b.nama.toLowerCase().includes(barangSearch.toLowerCase()) ||
                        b.kode.toLowerCase().includes(barangSearch.toLowerCase());
    return matchCat && matchMerek && matchSearch;
  });

  const tableRows = filtered.length > 0 ? filtered.map(b => {
    const cat = kategoriList.find(k => k.id === b.kategori_id);
    const mrk = merekList.find(m => m.id === b.merek_id);
    const margin = b.harga_beli > 0 ? (((b.harga_jual - b.harga_beli) / b.harga_beli) * 100).toFixed(1) : 0;

    const isOut = b.stok === 0;
    const isLow = b.stok <= b.stok_minimum;
    const rowClass = isOut ? 'row-pink-alert' : (isLow ? 'row-amber-alert' : '');

    return `
      <tr class="${rowClass}">
        <td style="min-width:110px;"><span class="font-mono" style="font-weight:700; font-size:12px;">${esc(b.kode)}</span></td>
        <td style="min-width:180px; max-width:260px;">
          <div style="font-weight:700; color:var(--slate-900); font-size:13px; white-space:normal;">${esc(b.nama)}</div>
          <div style="font-size:11px; color:var(--slate-500);">${cat ? esc(cat.nama) : ''} · ${mrk ? esc(mrk.nama) : ''}</div>
        </td>
        <td style="min-width:130px;">
          <div class="font-mono" style="font-size:12px; color:var(--slate-600);">Beli: Rp ${num(b.harga_beli).toLocaleString('id-ID')}</div>
          <div class="font-mono" style="font-weight:700; color:var(--cobalt-700); font-size:13px;">Jual: Rp ${num(b.harga_jual).toLocaleString('id-ID')}</div>
        </td>
        <td style="min-width:70px; text-align:center;">
          <span class="badge badge-emerald">+${margin}%</span>
        </td>
        <td style="min-width:80px; text-align:center;">
          <span class="badge ${isOut ? 'badge-crimson' : (isLow ? 'badge-amber' : 'badge-emerald')}">
            ${b.stok} ${esc(b.satuan)}
          </span>
          <div style="font-size:10px; color:var(--slate-500); margin-top:2px;">Min: ${b.stok_minimum}</div>
        </td>
        <td style="min-width:110px;">
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-secondary edit-barang-btn" data-id="${b.id}">✏️ Edit</button>
            <button class="btn btn-sm btn-danger delete-barang-btn" data-id="${b.id}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="6" class="text-center" style="padding:40px; color:var(--slate-400);">
        Data barang tidak ditemukan. Tambahkan barang baru atau ubah filter pencarian.
      </td>
    </tr>
  `;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <!-- Top Control Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">📦 Master Data Barang</h2>
          <p style="font-size:13px; color:var(--slate-500);">Kelola katalog produk, harga jual/beli, dan batas minimum stok toko.</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button id="manage-kategori-btn" class="btn btn-secondary">🏷️ Kategori</button>
          <button id="manage-merek-btn" class="btn btn-secondary">™️ Merek</button>
          <button id="add-barang-btn" class="btn btn-primary btn-lg">➕ Tambah Barang Baru</button>
        </div>
      </div>

      <!-- Table Card -->
      <div class="table-container">
        <div class="table-toolbar">
          <div class="table-search">
            <input type="text" id="barang-search-input" placeholder="Cari Kode / Nama Barang..." value="${esc(barangSearch)}">
          </div>
          <div class="table-filters">
            <select id="filter-kategori-select" class="table-select">
              <option value="">Semua Kategori</option>
              ${kategoriList.map(k => `<option value="${k.id}" ${selectedCategoryFilter === String(k.id) ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}
            </select>
            <select id="filter-merek-select" class="table-select">
              <option value="">Semua Merek</option>
              ${merekList.map(m => `<option value="${m.id}" ${selectedMerekFilter === String(m.id) ? 'selected' : ''}>${esc(m.nama)}</option>`).join('')}
            </select>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Barang · Kategori · Merek</th>
              <th>Harga Beli / Jual</th>
              <th class="text-center">Margin</th>
              <th class="text-center">Stok (Min)</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="table-pagination">
          <div>Menampilkan ${filtered.length} dari ${barangList.length} total barang</div>
          <div style="display:flex; gap:6px;">
            <span class="badge badge-amber">⚠️ Kuning = Stok Menipis</span>
            <span class="badge badge-crimson">🚨 Merah = Stok Habis (0)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Barang Modal Placeholder -->
    <div id="barang-form-modal" class="modal-backdrop"></div>
  `;

  setTimeout(() => {
    // Search — update table rows only, no full re-render
    document.getElementById('barang-search-input')?.addEventListener('input', (e) => {
      barangSearch = e.target.value;
      updateBarangTable();
    });

    document.getElementById('filter-kategori-select')?.addEventListener('change', (e) => {
      selectedCategoryFilter = e.target.value;
      updateBarangTable();
    });

    document.getElementById('filter-merek-select')?.addEventListener('change', (e) => {
      selectedMerekFilter = e.target.value;
      updateBarangTable();
    });

    document.getElementById('add-barang-btn')?.addEventListener('click', () => {
      openBarangModal();
    });

    document.getElementById('manage-kategori-btn')?.addEventListener('click', () => {
      openMasterModal('kategori');
    });

    document.getElementById('manage-merek-btn')?.addEventListener('click', () => {
      openMasterModal('merek');
    });

    document.querySelectorAll('.edit-barang-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.id);
        const item = cachedBarangList.find(b => b.id === id);
        if (item) openBarangModal(item);
      };
    });

    document.querySelectorAll('.delete-barang-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const item = cachedBarangList.find(b => b.id === id);
        if (confirm(`Yakin ingin menghapus barang "${item.nama}"?`)) {
          try {
            await store.deleteBarang(id);
            showToast('Barang berhasil dihapus!', 'success');
            refreshBarangView();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      };
    });
  }, 0);

  return html;
}

function openBarangModal(barangItem = null) {
  const modalContainer = document.getElementById('barang-form-modal');
  if (!modalContainer) return;

  const isEdit = !!barangItem;
  const kategoriList = cachedKategoriList;
  const merekList = cachedMerekList;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 650px;">
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h3>
        <button class="modal-close-btn" id="modal-close-x">&times;</button>
      </div>
      <form id="barang-form">
        <div class="modal-body form-grid">
          <div class="form-group">
            <label class="form-label">Kode Barang <span class="required">*</span></label>
            <input type="text" id="form-kode" class="form-control font-mono" placeholder="misal: HP-IP14PM-256" value="${barangItem ? esc(barangItem.kode) : ''}" ${isEdit ? 'readonly' : 'required'}>
          </div>

          <div class="form-group">
            <label class="form-label">Nama Barang <span class="required">*</span></label>
            <input type="text" id="form-nama" class="form-control" placeholder="Nama lengkap produk" value="${barangItem ? esc(barangItem.nama) : ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Kategori <span class="required">*</span></label>
            <select id="form-kategori" class="form-control" required>
              ${kategoriList.map(k => `<option value="${k.id}" ${barangItem && barangItem.kategori_id === k.id ? 'selected' : ''}>${esc(k.nama)}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Merek <span class="required">*</span></label>
            <select id="form-merek" class="form-control" required>
              ${merekList.map(m => `<option value="${m.id}" ${barangItem && barangItem.merek_id === m.id ? 'selected' : ''}>${esc(m.nama)}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Harga Beli (Modal) Rp <span class="required">*</span></label>
            <input type="number" id="form-harga-beli" class="form-control font-mono" placeholder="0" value="${barangItem ? barangItem.harga_beli : ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Harga Jual Rp <span class="required">*</span></label>
            <input type="number" id="form-harga-jual" class="form-control font-mono" placeholder="0" value="${barangItem ? barangItem.harga_jual : ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Stok Awal / Saat Ini <span class="required">*</span></label>
            <input type="number" id="form-stok" class="form-control font-mono" min="0" value="${barangItem ? barangItem.stok : 0}" ${isEdit ? 'readonly' : 'required'}>
            ${isEdit ? '<span class="form-helper">Stok diubah via Stok Masuk / Kasir</span>' : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Stok Minimum (Alert Warning) <span class="required">*</span></label>
            <input type="number" id="form-stok-min" class="form-control font-mono" min="0" value="${barangItem ? barangItem.stok_minimum : 2}" required>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Deskripsi & Garansi</label>
            <textarea id="form-deskripsi" class="form-control" placeholder="Keterangan garansi resmi, spesifikasi ringkas">${barangItem ? esc(barangItem.deskripsi || '') : ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Barang</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');

  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('modal-close-x').onclick = closeModal;
  document.getElementById('modal-cancel-btn').onclick = closeModal;

  document.getElementById('barang-form').onsubmit = async (e) => {
    e.preventDefault();
    const kode = document.getElementById('form-kode').value.trim();
    const nama = document.getElementById('form-nama').value.trim();
    const kategori_id = Number(document.getElementById('form-kategori').value);
    const merek_id = Number(document.getElementById('form-merek').value);
    const harga_beli = Number(document.getElementById('form-harga-beli').value);
    const harga_jual = Number(document.getElementById('form-harga-jual').value);
    const stok = Number(document.getElementById('form-stok').value);
    const stok_minimum = Number(document.getElementById('form-stok-min').value);
    const deskripsi = document.getElementById('form-deskripsi').value.trim();

    if (harga_jual < harga_beli) {
      showToast('Peringatan: Harga jual tidak boleh lebih rendah dari harga beli (jual rugi)!', 'error');
      return;
    }

    try {
      if (isEdit) {
        await store.updateBarang(barangItem.id, { nama, kategori_id, merek_id, harga_beli, harga_jual, stok_minimum, deskripsi });
        showToast('Data barang berhasil diupdate!', 'success');
      } else {
        // Validate unique code
        const exists = cachedBarangList.some(b => b.kode.toLowerCase() === kode.toLowerCase());
        if (exists) {
          showToast(`Kode barang "${esc(kode)}" sudah digunakan!`, 'error');
          return;
        }
        await store.addBarang({ kode, nama, kategori_id, merek_id, satuan: 'Unit', harga_beli, harga_jual, stok, stok_minimum, deskripsi });
        showToast('Barang baru berhasil ditambahkan!', 'success');
      }
      closeModal();
      refreshBarangView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

function updateBarangTable() {
  const tbody = document.querySelector('.data-table tbody');
  const countEl = document.querySelector('.table-pagination div:first-child');
  if (!tbody) return;

  const filtered = cachedBarangList.filter(b => {
    const matchCat   = !selectedCategoryFilter || b.kategori_id === Number(selectedCategoryFilter);
    const matchMerek = !selectedMerekFilter    || b.merek_id    === Number(selectedMerekFilter);
    const matchSearch = b.nama.toLowerCase().includes(barangSearch.toLowerCase()) ||
                        b.kode.toLowerCase().includes(barangSearch.toLowerCase());
    return matchCat && matchMerek && matchSearch;
  });

  tbody.innerHTML = filtered.length > 0 ? filtered.map(b => {
    const cat    = cachedKategoriList.find(k => k.id === b.kategori_id);
    const mrk    = cachedMerekList.find(m => m.id === b.merek_id);
    const margin = b.harga_beli > 0 ? (((b.harga_jual - b.harga_beli) / b.harga_beli) * 100).toFixed(1) : 0;
    const isOut  = b.stok === 0;
    const isLow  = b.stok <= b.stok_minimum;
    const rowClass = isOut ? 'row-pink-alert' : (isLow ? 'row-amber-alert' : '');
    return `
      <tr class="${rowClass}">
        <td style="min-width:110px;"><span class="font-mono" style="font-weight:700;font-size:12px;">${esc(b.kode)}</span></td>
        <td style="min-width:180px;max-width:260px;">
          <div style="font-weight:700;color:var(--slate-900);font-size:13px;white-space:normal;">${esc(b.nama)}</div>
          <div style="font-size:11px;color:var(--slate-500);">${cat ? esc(cat.nama) : ''} · ${mrk ? esc(mrk.nama) : ''}</div>
        </td>
        <td style="min-width:130px;">
          <div class="font-mono" style="font-size:12px;color:var(--slate-600);">Beli: Rp ${num(b.harga_beli).toLocaleString('id-ID')}</div>
          <div class="font-mono" style="font-weight:700;color:var(--cobalt-700);font-size:13px;">Jual: Rp ${num(b.harga_jual).toLocaleString('id-ID')}</div>
        </td>
        <td style="min-width:70px;text-align:center;"><span class="badge badge-emerald">+${margin}%</span></td>
        <td style="min-width:80px;text-align:center;">
          <span class="badge ${isOut ? 'badge-crimson' : (isLow ? 'badge-amber' : 'badge-emerald')}">${b.stok} ${esc(b.satuan)}</span>
          <div style="font-size:10px;color:var(--slate-500);margin-top:2px;">Min: ${b.stok_minimum}</div>
        </td>
        <td style="min-width:110px;">
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary edit-barang-btn" data-id="${b.id}">✏️ Edit</button>
            <button class="btn btn-sm btn-danger delete-barang-btn" data-id="${b.id}">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--slate-400);">Data barang tidak ditemukan.</td></tr>`;

  if (countEl) countEl.textContent = `Menampilkan ${filtered.length} dari ${cachedBarangList.length} total barang`;

  // Re-attach row button events
  document.querySelectorAll('.edit-barang-btn').forEach(btn => {
    btn.onclick = () => {
      const item = cachedBarangList.find(b => b.id === Number(btn.dataset.id));
      if (item) openBarangModal(item);
    };
  });
  document.querySelectorAll('.delete-barang-btn').forEach(btn => {
    btn.onclick = async () => {
      const item = cachedBarangList.find(b => b.id === Number(btn.dataset.id));
      if (!item) return;
      if (confirm(`Yakin ingin menghapus barang "${item.nama}"?`)) {
        try {
          await store.deleteBarang(item.id);
          showToast('Barang berhasil dihapus!', 'success');
          cachedBarangList = cachedBarangList.filter(b => b.id !== item.id);
          updateBarangTable();
        } catch (err) { showToast(err.message, 'error'); }
      }
    };
  });
}

function refreshBarangView() {
  const contentArea = document.querySelector('.app-content');
  if (contentArea && window.location.hash.includes('/barang')) {
    renderBarang().then(h => { contentArea.innerHTML = h; });
  }
}
