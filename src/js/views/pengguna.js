// Kelola Pengguna View Component (khusus Owner)

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc } from '../utils/helpers.js';

export async function renderPengguna() {
  let users = [];
  try {
    users = await store.getUsers();
  } catch (err) {
    showToast(err.message || 'Gagal memuat data user.', 'error');
  }

  const me = store.getCurrentUser();
  const hasStatusCol = users.length > 0 && users[0].is_active !== undefined && users[0].is_active !== null;

  const roleBadge = (role) => role === 'Owner'
    ? '<span class="badge" style="background:#fef3c7;color:#92400e;">👑 Owner</span>'
    : '<span class="badge" style="background:#dbeafe;color:#1e40af;">🛠️ Admin</span>';

  const rowsHtml = users.length > 0 ? users.map((u, idx) => {
    const isSelf = Number(u.id) === Number(me.id);
    const active = u.is_active === undefined || u.is_active === null ? 1 : Number(u.is_active);
    const statusBadge = active
      ? '<span class="badge" style="background:#d1fae5;color:#065f46;">● Aktif</span>'
      : '<span class="badge" style="background:#fee2e2;color:#991b1b;">● Nonaktif</span>';
    return `
    <tr style="${!active ? 'opacity:0.6;' : ''}">
      <td><span class="badge badge-slate">${idx + 1}</span></td>
      <td class="font-mono"><strong>${esc(u.username)}</strong>${isSelf ? ' <span class="badge badge-slate">kamu</span>' : ''}</td>
      <td>${esc(u.nama)}</td>
      <td>${roleBadge(u.role)}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px; color:var(--slate-500);">${esc(u.created_at || '-')}</td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary edit-user-btn" data-id="${u.id}">✏️ Edit</button>
          <button class="btn btn-sm btn-secondary reset-pass-btn" data-id="${u.id}" data-nama="${esc(u.nama)}">🔑 Reset Password</button>
          ${hasStatusCol && !isSelf ? `<button class="btn btn-sm ${active ? 'btn-danger' : 'btn-primary'} toggle-active-btn" data-id="${u.id}" data-active="${active}" data-nama="${esc(u.nama)}">${active ? '🚫 Nonaktifkan' : '✅ Aktifkan'}</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="text-center" style="padding:30px; color:var(--slate-400);">Belum ada data user</td></tr>`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">👥 Kelola Pengguna</h2>
          <p style="font-size:13px; color:var(--slate-500);">Tambah akun admin baru, reset password, atau nonaktifkan akun yang sudah tidak dipakai.</p>
        </div>
        <button id="add-user-btn" class="btn btn-primary btn-lg">➕ Tambah User</button>
      </div>

      ${!hasStatusCol ? `<div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:10px 14px; font-size:13px; color:#92400e;">
        ⚠️ Jalankan <span class="font-mono">database/migrasi-keamanan.sql</span> di HeidiSQL untuk mengaktifkan fitur nonaktif user.
      </div>` : ''}

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Nama</th>
              <th>Role</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div id="user-modal" class="modal-backdrop"></div>
  `;

  setTimeout(() => {
    document.getElementById('add-user-btn')?.addEventListener('click', () => openUserModal());

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.onclick = async () => {
        const u = (await store.getUsers()).find(x => Number(x.id) === Number(btn.dataset.id));
        if (u) openUserModal(u);
      };
    });

    document.querySelectorAll('.reset-pass-btn').forEach(btn => {
      btn.onclick = () => openResetPassModal(btn.dataset.id, btn.dataset.nama);
    });

    document.querySelectorAll('.toggle-active-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const active = Number(btn.dataset.active);
        const nama = btn.dataset.nama;
        const aksi = active ? 'menonaktifkan' : 'mengaktifkan kembali';
        if (!confirm(`Yakin ingin ${aksi} akun "${nama}"?${active ? '\nUser yang dinonaktifkan tidak bisa login lagi.' : ''}`)) return;
        try {
          await store.updateUser({ id, is_active: active ? 0 : 1 });
          showToast(`Akun "${nama}" berhasil ${active ? 'dinonaktifkan' : 'diaktifkan'}.`, 'success');
          refreshPage();
        } catch (err) {
          showToast(err.message || 'Gagal mengubah status user.', 'error');
        }
      };
    });
  }, 0);

  return html;
}

function refreshPage() {
  const contentArea = document.querySelector('.app-content');
  if (contentArea) {
    renderPengguna().then(h => { contentArea.innerHTML = h; });
  }
}

function openUserModal(user = null) {
  const isEdit = !!user;
  const me = store.getCurrentUser();
  const isSelf = isEdit && Number(user.id) === Number(me.id);
  const modalContainer = document.getElementById('user-modal');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? 'Edit User' : 'Tambah User Baru'}</h3>
        <button class="modal-close-btn" id="usr-close-x">&times;</button>
      </div>
      <form id="usr-form">
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
          <div class="form-group">
            <label class="form-label">Username <span class="required">*</span></label>
            <input type="text" id="usr-username" class="form-control font-mono" placeholder="huruf/angka/underscore, min 3 karakter"
              value="${isEdit ? esc(user.username) : ''}" ${isEdit ? 'disabled' : ''} required>
            ${isEdit ? '<span class="form-helper">Username tidak bisa diubah</span>' : ''}
          </div>
          <div class="form-group">
            <label class="form-label">Nama Lengkap <span class="required">*</span></label>
            <input type="text" id="usr-nama" class="form-control" placeholder="Nama user" value="${isEdit ? esc(user.nama) : ''}" required>
          </div>
          ${!isEdit ? `
          <div class="form-group">
            <label class="form-label">Password <span class="required">*</span></label>
            <input type="password" id="usr-password" class="form-control" placeholder="Minimal 8 karakter" minlength="8" required>
          </div>` : ''}
          <div class="form-group">
            <label class="form-label">Role <span class="required">*</span></label>
            <select id="usr-role" class="form-control" ${isSelf ? 'disabled' : ''}>
              <option value="Admin" ${isEdit && user.role === 'Admin' ? 'selected' : ''}>🛠️ Admin</option>
              <option value="Owner" ${isEdit && user.role === 'Owner' ? 'selected' : ''}>👑 Owner</option>
            </select>
            ${isSelf ? '<span class="form-helper">Tidak bisa mengubah role akun sendiri</span>' : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="usr-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Tambah User'}</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('usr-close-x').onclick = closeModal;
  document.getElementById('usr-cancel-btn').onclick = closeModal;

  document.getElementById('usr-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    const nama = document.getElementById('usr-nama').value.trim();
    const role = document.getElementById('usr-role').value;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';
      if (isEdit) {
        const payload = { id: Number(user.id), nama };
        if (!isSelf) payload.role = role;
        await store.updateUser(payload);
        showToast('Data user berhasil diperbarui!', 'success');
      } else {
        const username = document.getElementById('usr-username').value.trim();
        const password = document.getElementById('usr-password').value;
        await store.createUser({ username, nama, password, role });
        showToast(`User "${username}" berhasil ditambahkan!`, 'success');
      }
      closeModal();
      refreshPage();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan user.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Simpan Perubahan' : 'Tambah User';
    }
  };
}

function openResetPassModal(id, nama) {
  const modalContainer = document.getElementById('user-modal');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="modal-title">🔑 Reset Password</h3>
        <button class="modal-close-btn" id="usr-close-x">&times;</button>
      </div>
      <form id="usr-reset-form">
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
          <p style="font-size:13px; color:var(--slate-600);">Set password baru untuk <strong>${esc(nama)}</strong>:</p>
          <div class="form-group">
            <label class="form-label">Password Baru <span class="required">*</span></label>
            <input type="password" id="usr-new-password" class="form-control" placeholder="Minimal 8 karakter" minlength="8" required>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="usr-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Reset Password</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('usr-close-x').onclick = closeModal;
  document.getElementById('usr-cancel-btn').onclick = closeModal;

  document.getElementById('usr-reset-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    const password = document.getElementById('usr-new-password').value;
    if (!confirm(`Reset password untuk "${nama}"?`)) return;
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';
      await store.updateUser({ id: Number(id), password });
      showToast(`Password "${nama}" berhasil di-reset.`, 'success');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Gagal me-reset password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  };
}
