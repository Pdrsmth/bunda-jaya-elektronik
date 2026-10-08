// Kategori & Merek Manager Modal Component
// Dibuka dari halaman Master Barang — kelola penuh (tambah/edit/hapus).

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc } from '../utils/helpers.js';

const TABS = {
  kategori: { title: '🏷️ Kategori', hasDeskripsi: true },
  merek: { title: '™️ Merek', hasDeskripsi: false },
};

let activeTab = 'kategori';
let masterChanged = false;

export function openMasterModal(tab = 'kategori') {
  activeTab = TABS[tab] ? tab : 'kategori';
  masterChanged = false;

  let modalContainer = document.getElementById('master-modal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'master-modal';
    modalContainer.className = 'modal-backdrop';
    document.body.appendChild(modalContainer);
  }

  renderMasterModal(modalContainer);
  modalContainer.classList.add('active');
}

function renderMasterModal(modalContainer) {
  const isOwner = store.getCurrentUser().role === 'Owner';

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 560px;">
      <div class="modal-header">
        <h3 class="modal-title">Kelola Kategori & Merek</h3>
        <button class="modal-close-btn" id="master-close-x">&times;</button>
      </div>
      <div style="display:flex; gap:8px; padding:12px 20px 0;">
        ${Object.entries(TABS).map(([key, t]) => `
          <button class="btn btn-sm ${activeTab === key ? 'btn-primary' : 'btn-secondary'} master-tab-btn" data-tab="${key}">${t.title}</button>
        `).join('')}
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:14px; padding-top:12px;">
        <form id="master-add-form" style="display:flex; gap:8px; align-items:end; flex-wrap:wrap;">
          <div class="form-group" style="flex:2; min-width:160px; margin:0;">
            <label class="form-label">Nama Baru</label>
            <input type="text" id="master-new-nama" class="form-control" placeholder="Nama ${activeTab}" required>
          </div>
          ${TABS[activeTab].hasDeskripsi ? `
          <div class="form-group" style="flex:2; min-width:160px; margin:0;">
            <label class="form-label">Deskripsi (opsional)</label>
            <input type="text" id="master-new-deskripsi" class="form-control" placeholder="Keterangan singkat">
          </div>` : ''}
          <button type="submit" class="btn btn-primary btn-sm" id="master-add-btn">➕ Tambah</button>
        </form>
        <div id="master-list" style="display:flex; flex-direction:column; gap:8px; max-height:320px; overflow-y:auto;">
          <div style="text-align:center; color:var(--slate-400); padding:20px;">Memuat...</div>
        </div>
      </div>
      <div class="modal-footer">
        <span style="font-size:12px; color:var(--slate-500);">Hapus hanya bisa oleh Owner & jika tidak dipakai barang.</span>
        <button type="button" class="btn btn-secondary" id="master-close-btn">Tutup</button>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalContainer.classList.remove('active');
    if (masterChanged) {
      // Refresh halaman barang agar dropdown kategori/merek ikut update
      const contentArea = document.querySelector('.app-content');
      if (contentArea && window.location.hash.includes('/barang')) {
        import('./barang.js').then(m => m.renderBarang().then(h => { contentArea.innerHTML = h; }));
      }
    }
  };
  document.getElementById('master-close-x').onclick = closeModal;
  document.getElementById('master-close-btn').onclick = closeModal;

  modalContainer.querySelectorAll('.master-tab-btn').forEach(btn => {
    btn.onclick = () => { activeTab = btn.dataset.tab; renderMasterModal(modalContainer); };
  });

  document.getElementById('master-add-form').onsubmit = async (e) => {
    e.preventDefault();
    const namaEl = document.getElementById('master-new-nama');
    const nama = namaEl.value.trim();
    if (!nama) return;
    const payload = { nama };
    if (TABS[activeTab].hasDeskripsi) {
      payload.deskripsi = document.getElementById('master-new-deskripsi').value.trim();
    }
    try {
      if (activeTab === 'kategori') await store.createKategori(payload);
      else await store.createMerek(payload);
      masterChanged = true;
      showToast(`${TABS[activeTab].title} "${nama}" ditambahkan.`, 'success');
      renderMasterModal(modalContainer);
    } catch (err) {
      showToast(err.message || 'Gagal menambah data.', 'error');
    }
  };

  loadMasterList(modalContainer, isOwner);
}

async function loadMasterList(modalContainer, isOwner) {
  const listEl = modalContainer.querySelector('#master-list');
  if (!listEl) return;

  let items = [];
  try {
    items = activeTab === 'kategori'
      ? await store.getKategori(true)
      : await store.getMerek(true);
  } catch (err) {
    listEl.innerHTML = `<div style="text-align:center; color:var(--crimson-600); padding:20px;">Gagal memuat data.</div>`;
    return;
  }

  if (items.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; color:var(--slate-400); padding:20px;">Belum ada data.</div>`;
    return;
  }

  listEl.innerHTML = items.map(it => `
    <div class="master-row" data-id="${it.id}" style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--slate-50); border-radius:8px;">
      <div style="flex:1; min-width:0;">
        <div style="font-weight:700; font-size:13px;">${esc(it.nama)}</div>
        ${it.deskripsi ? `<div style="font-size:11px; color:var(--slate-500);">${esc(it.deskripsi)}</div>` : ''}
      </div>
      <button class="btn btn-sm btn-secondary master-edit-btn" data-id="${it.id}">✏️</button>
      ${isOwner ? `<button class="btn btn-sm btn-danger master-del-btn" data-id="${it.id}" data-nama="${esc(it.nama)}">🗑️</button>` : ''}
    </div>
  `).join('');

  // Edit inline
  listEl.querySelectorAll('.master-edit-btn').forEach(btn => {
    btn.onclick = () => {
      const row = btn.closest('.master-row');
      const it = items.find(x => Number(x.id) === Number(btn.dataset.id));
      if (!it) return;
      row.innerHTML = `
        <input type="text" class="form-control master-edit-nama" value="${esc(it.nama)}" style="flex:2;">
        ${TABS[activeTab].hasDeskripsi ? `<input type="text" class="form-control master-edit-deskripsi" value="${esc(it.deskripsi || '')}" placeholder="Deskripsi" style="flex:2;">` : ''}
        <button class="btn btn-sm btn-primary master-save-btn">💾</button>
        <button class="btn btn-sm btn-secondary master-cancel-btn">✖️</button>
      `;
      row.querySelector('.master-save-btn').onclick = async () => {
        const nama = row.querySelector('.master-edit-nama').value.trim();
        if (!nama) { showToast('Nama tidak boleh kosong.', 'error'); return; }
        const payload = { nama };
        if (TABS[activeTab].hasDeskripsi) {
          payload.deskripsi = row.querySelector('.master-edit-deskripsi').value.trim();
        }
        try {
          if (activeTab === 'kategori') await store.updateKategori(it.id, payload);
          else await store.updateMerek(it.id, payload);
          masterChanged = true;
          showToast('Berhasil diupdate.', 'success');
          loadMasterList(modalContainer, isOwner);
        } catch (err) {
          showToast(err.message || 'Gagal mengupdate.', 'error');
        }
      };
      row.querySelector('.master-cancel-btn').onclick = () => loadMasterList(modalContainer, isOwner);
    };
  });

  // Delete
  listEl.querySelectorAll('.master-del-btn').forEach(btn => {
    btn.onclick = async () => {
      const nama = btn.dataset.nama;
      if (!confirm(`Hapus "${nama}"?\nTidak bisa dihapus jika masih dipakai barang.`)) return;
      try {
        if (activeTab === 'kategori') await store.deleteKategori(btn.dataset.id);
        else await store.deleteMerek(btn.dataset.id);
        masterChanged = true;
        showToast(`"${nama}" dihapus.`, 'success');
        loadMasterList(modalContainer, isOwner);
      } catch (err) {
        showToast(err.message || 'Gagal menghapus.', 'error');
      }
    };
  });
}
