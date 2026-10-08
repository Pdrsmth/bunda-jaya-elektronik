// Master Data Supplier View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc } from '../utils/helpers.js';

export async function renderSupplier() {
  const suppliers = await store.getSupplier();
  const isOwner = (store.getCurrentUser().role === 'Owner');

  const rowsHtml = suppliers.length > 0 ? suppliers.map((s, idx) => `
    <tr>
      <td><span class="badge badge-slate">${idx + 1}</span></td>
      <td><strong>${esc(s.nama)}</strong></td>
      <td class="font-mono">📞 ${esc(s.kontak) || '-'}</td>
      <td>📍 ${esc(s.alamat) || '-'}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-secondary edit-supplier-btn" data-id="${s.id}">✏️ Edit</button>
          ${isOwner ? `<button class="btn btn-sm btn-danger delete-supplier-btn" data-id="${s.id}">🗑️</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="5" class="text-center" style="padding:30px; color:var(--slate-400);">Belum ada data supplier</td></tr>`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">🏭 Master Data Supplier</h2>
          <p style="font-size:13px; color:var(--slate-500);">Daftar pemasok resmi distributor barang ritel elektronik.</p>
        </div>
        <button id="add-supplier-btn" class="btn btn-primary btn-lg">➕ Tambah Supplier Baru</button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Supplier</th>
              <th>Kontak Telepon</th>
              <th>Alamat Kantor / Gudang</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div id="supplier-modal" class="modal-backdrop"></div>
  `;

  setTimeout(() => {
    document.getElementById('add-supplier-btn')?.addEventListener('click', () => {
      openSupplierModal();
    });

    // Edit supplier
    document.querySelectorAll('.edit-supplier-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const suppliers = await store.getSupplier();
        const s = suppliers.find(x => x.id === id);
        if (s) openSupplierModal(s);
      };
    });

    // Hapus supplier (hanya Owner; backend validasi ulang)
    document.querySelectorAll('.delete-supplier-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const suppliers = await store.getSupplier();
        const s = suppliers.find(x => x.id === id);
        const nama = s ? s.nama : 'supplier ini';
        if (!confirm(`Yakin ingin menghapus "${nama}"?\nTidak bisa dihapus jika masih ada hutang aktif atau riwayat pembelian.`)) return;
        try {
          await store.deleteSupplier(id);
          showToast('Supplier berhasil dihapus.', 'success');
          const contentArea = document.querySelector('.app-content');
          if (contentArea) {
            renderSupplier().then(h => { contentArea.innerHTML = h; });
          }
        } catch (err) {
          showToast(err.message || 'Gagal menghapus supplier.', 'error');
        }
      };
    });
  }, 0);

  return html;
}

function openSupplierModal(supplier = null) {
  const isEdit = !!supplier;
  const modalContainer = document.getElementById('supplier-modal');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? 'Edit Supplier' : 'Tambah Supplier Baru'}</h3>
        <button class="modal-close-btn" id="supp-close-x">&times;</button>
      </div>
      <form id="supp-form">
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
          <div class="form-group">
            <label class="form-label">Nama Supplier / PT <span class="required">*</span></label>
            <input type="text" id="supp-nama" class="form-control" placeholder="misal: PT Sharp Trading Indonesia" value="${isEdit ? esc(supplier.nama) : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Kontak No. HP / Telp</label>
            <input type="text" id="supp-kontak" class="form-control font-mono" placeholder="0812-xxxx-xxxx" value="${isEdit ? esc(supplier.kontak || '') : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Alamat Lengkap</label>
            <textarea id="supp-alamat" class="form-control" placeholder="Alamat gudang / distributor">${isEdit ? esc(supplier.alamat || '') : ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="supp-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Simpan Supplier'}</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('supp-close-x').onclick = closeModal;
  document.getElementById('supp-cancel-btn').onclick = closeModal;

  document.getElementById('supp-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return; // cegah double submit
    const nama = document.getElementById('supp-nama').value.trim();
    const kontak = document.getElementById('supp-kontak').value.trim();
    const alamat = document.getElementById('supp-alamat').value.trim();

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';
      if (isEdit) {
        await store.updateSupplier(supplier.id, { nama, kontak, alamat });
        showToast('Perubahan supplier berhasil disimpan!', 'success');
      } else {
        await store.addSupplier({ nama, kontak, alamat });
        showToast('Supplier baru berhasil disimpan!', 'success');
      }
      closeModal();
      const contentArea = document.querySelector('.app-content');
      if (contentArea) {
        renderSupplier().then(h => { contentArea.innerHTML = h; });
      }
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan supplier.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Simpan Perubahan' : 'Simpan Supplier';
    }
  };
}
