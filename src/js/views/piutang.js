// Piutang Pelanggan (Kredit Fleksibel) View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc, formatRupiah as fmtRp, num } from '../utils/helpers.js';

let cachedPiutangList = [];

export async function renderPiutang() {
  cachedPiutangList = await store.getPiutang();
  const piutangList = cachedPiutangList;

  const totalAktif = piutangList
    .filter(p => p.status !== 'Lunas')
    .reduce((a, b) => a + Number(b.sisa_piutang), 0);

  const rowsHtml = piutangList.length > 0 ? piutangList.map(p => {
    const isLunas = p.status === 'Lunas';
    return `
      <tr class="${isLunas ? '' : 'row-amber-alert'}">
        <td>
          <strong>${esc(p.pelanggan_nama)}</strong>
          <div class="font-mono" style="font-size:11px; color:var(--slate-500);">📞 ${esc(p.pelanggan_kontak)}</div>
        </td>
        <td><span class="font-mono" style="font-size:12px;">${p.transaksi_nomor || '-'}</span></td>
        <td class="font-mono">${fmtRp(p.transaksi_total)}</td>
        <td class="font-mono" style="color:var(--slate-600);">${fmtRp(p.uang_muka)}</td>
        <td class="font-mono" style="color:var(--emerald-600);">${fmtRp(p.sudah_dibayar)}</td>
        <td class="font-mono" style="font-weight:700; color:var(--crimson-600);">${fmtRp(p.sisa_piutang)}</td>
        <td>
          <span class="badge ${isLunas ? 'badge-emerald' : 'badge-amber'}">
            ${isLunas ? '✓ Lunas' : '⏳ Belum Lunas'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            ${!isLunas ? `<button class="btn btn-sm btn-primary pay-piutang-btn" data-id="${p.id}">💳 Bayar</button>` : ''}
            <button class="btn btn-sm btn-secondary piutang-detail-btn" data-id="${p.id}">📄 Riwayat</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="8" class="text-center" style="padding:30px; color:var(--slate-400);">Belum ada piutang pelanggan</td></tr>`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">🧾 Piutang Pelanggan (Kredit)</h2>
          <p style="font-size:13px; color:var(--slate-500);">Tagihan kredit pelanggan — cicilan bebas, bayar kapan pun berapa pun.</p>
        </div>
        <div style="background:var(--amber-50, #fffbeb); border:1px solid var(--amber-200, #fde68a); padding:10px 18px; border-radius:var(--radius-lg); text-align:right;">
          <div style="font-size:11px; font-weight:700; color:var(--amber-800, #92400e); text-transform:uppercase;">TOTAL PIUTANG AKTIF</div>
          <div class="font-mono" style="font-size:22px; font-weight:800; color:var(--amber-800, #92400e);">${fmtRp(totalAktif)}</div>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>No. TRX</th>
              <th>Total Transaksi</th>
              <th>Uang Muka</th>
              <th>Sudah Dibayar</th>
              <th>Sisa Piutang</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>

    <div id="piutang-modal" class="modal-backdrop"></div>
  `;

  setTimeout(() => {
    document.querySelectorAll('.pay-piutang-btn').forEach(btn => {
      btn.onclick = () => {
        const p = cachedPiutangList.find(x => x.id === Number(btn.dataset.id));
        if (p) openPayPiutangModal(p);
      };
    });
    document.querySelectorAll('.piutang-detail-btn').forEach(btn => {
      btn.onclick = async () => {
        const detail = await fetchPiutangDetail(Number(btn.dataset.id));
        if (detail) openPiutangDetailModal(detail);
      };
    });
  }, 0);

  return html;
}

async function fetchPiutangDetail(id) {
  try {
    const { api } = await import('../api/client.js');
    const res = await api.getPiutangById(id);
    return res.success ? res.data : null;
  } catch (e) {
    showToast('Gagal memuat riwayat pembayaran.', 'error');
    return null;
  }
}

function openPayPiutangModal(p) {
  const modalContainer = document.getElementById('piutang-modal');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">Catat Pembayaran Piutang</h3>
        <button class="modal-close-btn" id="piutang-close-x">&times;</button>
      </div>
      <form id="pay-piutang-form">
        <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
          <div style="background:var(--slate-100); padding:12px; border-radius:var(--radius-md); font-size:13px; display:flex; flex-direction:column; gap:4px;">
            <div><strong>Pelanggan:</strong> ${esc(p.pelanggan_nama)} (${esc(p.pelanggan_kontak)})</div>
            <div><strong>No. TRX:</strong> ${p.transaksi_nomor || '-'}</div>
            <div><strong>Total Transaksi:</strong> ${fmtRp(p.transaksi_total)}</div>
            <div><strong>Uang Muka:</strong> ${fmtRp(p.uang_muka)}</div>
            <div><strong>Sudah Dibayar:</strong> ${fmtRp(p.sudah_dibayar)}</div>
            <div style="font-size:15px; font-weight:800; color:var(--crimson-600); margin-top:4px;">
              SISA PIUTANG: ${fmtRp(p.sisa_piutang)}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Jumlah Pembayaran Rp <span class="required">*</span></label>
            <input type="number" id="pay-piutang-amount" class="form-control font-mono" max="${p.sisa_piutang}" value="${p.sisa_piutang}" required>
            <span class="form-helper">Bebas — bisa cicilan sebagian atau pelunasan penuh</span>
          </div>

          <div class="form-group">
            <label class="form-label">Metode Pembayaran <span class="required">*</span></label>
            <select id="pay-piutang-method" class="form-control">
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="piutang-cancel-btn">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Pembayaran</button>
        </div>
      </form>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('piutang-close-x').onclick = closeModal;
  document.getElementById('piutang-cancel-btn').onclick = closeModal;

  document.getElementById('pay-piutang-form').onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return; // cegah double submit
    const amt = Number(document.getElementById('pay-piutang-amount').value);
    const method = document.getElementById('pay-piutang-method').value;

    if (amt <= 0 || amt > Number(p.sisa_piutang)) {
      showToast('Jumlah bayar harus lebih dari 0 dan tidak melebihi sisa piutang.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';
      await store.payPiutang(p.id, amt, method);
      showToast(`Pembayaran piutang ${fmtRp(amt)} berhasil disimpan!`, 'success');
      closeModal();
      const contentArea = document.querySelector('.app-content');
      if (contentArea) contentArea.innerHTML = await renderPiutang();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan pembayaran.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Pembayaran';
    }
  };
}

function openPiutangDetailModal(p) {
  const modalContainer = document.getElementById('piutang-modal');
  if (!modalContainer) return;

  const riwayat = p.riwayat_bayar || [];
  const rowsHtml = riwayat.length > 0 ? riwayat.map(r => `
    <tr>
      <td class="font-mono">${r.tanggal_bayar}</td>
      <td class="font-mono" style="font-weight:700; color:var(--emerald-600);">${fmtRp(r.jumlah_bayar)}</td>
      <td><span class="badge badge-slate">${esc(r.metode_bayar)}</span></td>
      <td style="font-size:12px;">${esc(r.user_nama) || '-'}</td>
    </tr>
  `).join('') : `<tr><td colspan="4" class="text-center" style="padding:20px; color:var(--slate-400);">Belum ada pembayaran cicilan</td></tr>`;

  modalContainer.innerHTML = `
    <div class="modal-dialog" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">Riwayat Piutang — ${esc(p.pelanggan_nama)}</h3>
        <button class="modal-close-btn" id="piutang-detail-close">&times;</button>
      </div>
      <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:var(--slate-100); padding:12px; border-radius:var(--radius-md); font-size:13px;">
          <div><strong>No. TRX:</strong> ${p.transaksi_nomor || '-'}</div>
          <div><strong>Tanggal:</strong> ${p.transaksi_tanggal || '-'}</div>
          <div><strong>Total Transaksi:</strong> ${fmtRp(p.transaksi_total)}</div>
          <div><strong>Uang Muka:</strong> ${fmtRp(p.uang_muka)}</div>
          <div><strong>Sudah Dibayar:</strong> ${fmtRp(p.sudah_dibayar)}</div>
          <div><strong>Sisa:</strong> <strong class="font-mono" style="color:var(--crimson-600);">${fmtRp(p.sisa_piutang)}</strong></div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Tanggal Bayar</th>
              <th>Jumlah</th>
              <th>Metode</th>
              <th>Dicatat Oleh</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="piutang-detail-btn-close">Tutup</button>
      </div>
    </div>
  `;

  modalContainer.classList.add('active');
  const closeModal = () => modalContainer.classList.remove('active');
  document.getElementById('piutang-detail-close').onclick = closeModal;
  document.getElementById('piutang-detail-btn-close').onclick = closeModal;
}
