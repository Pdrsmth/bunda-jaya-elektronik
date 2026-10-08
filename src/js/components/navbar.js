// Top Navbar Component

import { store } from '../store.js';
import { showToast } from './toast.js';
import { esc } from '../utils/helpers.js';

export function renderNavbar(title) {
  const user = store.getCurrentUser();
  const roleBadgeColor = {
    Owner: { bg: '#fef3c7', color: '#92400e' },
    Admin: { bg: '#dbeafe', color: '#1e40af' },
    Kasir: { bg: '#d1fae5', color: '#065f46' },
  }[user.role] || { bg: '#f1f5f9', color: '#334155' };

  return `
    <div class="header-left">
      <div class="header-title">${title}</div>
    </div>
    <div class="header-actions">
      <div class="header-date">
        📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
      <div style="display:flex; align-items:center; gap:8px; background:var(--slate-100); padding:6px 12px; border-radius:8px;">
        <span style="font-size:13px; font-weight:600; color:var(--slate-700);">${esc(user.name || user.nama)}</span>
        <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; background:${roleBadgeColor.bg}; color:${roleBadgeColor.color};">${user.role}</span>
      </div>
      <button id="change-pass-btn" style="padding:7px 14px; background:var(--slate-100); color:var(--slate-700); border:1px solid var(--slate-200); border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:5px;">
        🔑 Ganti Password
      </button>
      <button id="logout-btn" style="padding:7px 14px; background:#ef4444; color:white; border:none; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:5px;">
        🚪 Keluar
      </button>
    </div>
    <div id="change-pass-modal" class="modal-backdrop"></div>
  `;
}

export function attachNavbarEvents() {
  const btn = document.getElementById('change-pass-btn');
  if (btn) {
    btn.onclick = () => openChangePasswordModal();
  }
}

function openChangePasswordModal() {
  const modalContainer = document.getElementById('change-pass-modal');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="modal-title">🔑 Ganti Password</h3>
        <button class="modal-close-btn" id="cp-close-x">&times;</button>
      </div>
      <form id="cp-form">
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
          <div class="form-group">
            <label class="form-label">Password Lama <span class="required">*</span></label>
            <input type="password" id="cp-old" class="form-control" required autocomplete="current-password">
          </div>
          <div class="form-group">
            <label class="form-label">Password Baru <span class="required">*</span></label>
            <input type="password" id="cp-new" class="form-control" placeholder="Minimal 8 karakter" minlength="8" required autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label">Konfirmasi Password Baru <span class="required">*</span></label>
            <input type="password" id="cp-confirm" class="form-control" required autocomplete="new-password">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cp-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Password Baru</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('cp-close-x').onclick = closeModal;
  document.getElementById('cp-cancel-btn').onclick = closeModal;

  document.getElementById('cp-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;
    const oldPass = document.getElementById('cp-old').value;
    const newPass = document.getElementById('cp-new').value;
    const confirmPass = document.getElementById('cp-confirm').value;

    if (newPass !== confirmPass) {
      showToast('Konfirmasi password baru tidak cocok.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';
      await store.changePassword(oldPass, newPass);
      showToast('Password berhasil diubah!', 'success');
      closeModal();
    } catch (err) {
      showToast(err.message || 'Gagal mengubah password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Password Baru';
    }
  };
}
