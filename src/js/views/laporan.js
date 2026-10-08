// Laporan Owner View Components
// Semua agregasi dihitung di server (api/dashboard.php) — frontend hanya render.

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { esc, todayLocal, formatRupiah as fmtRp, num } from '../utils/helpers.js';

function todayStr() {
  return todayLocal();
}

function firstOfMonthStr() {
  const d = new Date();
  d.setDate(1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export async function renderLaporan(subPath = '/laporan/penjualan') {
  if (subPath.includes('terlaris')) return renderLaporanTerlaris();
  if (subPath.includes('stok-menipis')) return renderLaporanStokMenipis();
  if (subPath.includes('kas')) return renderLaporanKas();
  return renderLaporanPenjualanHarian();
}

// 1. Laporan Penjualan Harian
async function renderLaporanPenjualanHarian() {
  const tanggal = todayStr();
  const data = await store.getLaporanPenjualanHarian(tanggal);

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">📈 Laporan Penjualan & Laba Kotor Harian</h2>
          <p style="font-size:13px; color:var(--slate-500);">Rekapitulasi omzet penjualan, total modal HPP, dan laba kotor per tanggal.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="date" id="lap-tanggal" class="form-control" value="${tanggal}" max="${tanggal}" style="width:auto;">
          <button id="lap-tampil-btn" class="btn btn-primary">Tampilkan</button>
        </div>
      </div>
      <div id="lap-content">${penjualanHarianHtml(data)}</div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('lap-tampil-btn')?.addEventListener('click', async () => {
      const t = document.getElementById('lap-tanggal').value || tanggal;
      const btn = document.getElementById('lap-tampil-btn');
      btn.disabled = true;
      btn.textContent = 'Memuat...';
      try {
        const d = await store.getLaporanPenjualanHarian(t);
        document.getElementById('lap-content').innerHTML = penjualanHarianHtml(d);
      } catch (err) {
        showToast(err.message || 'Gagal memuat laporan.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tampilkan';
      }
    });
  }, 0);

  return html;
}

function penjualanHarianHtml(data) {
  const summary = data?.summary || {};
  const transactions = data?.transactions || [];

  const totalOmzet  = Number(summary.total_pendapatan || 0);
  const totalHpp    = Number(summary.total_hpp || 0);
  const labaKotor   = Number(summary.laba_kotor || 0);
  const jumlahTrx   = Number(summary.total_transaksi || 0);

  const methodBox = (icon, label, amount, count) => `
    <div style="padding:12px; background:var(--slate-100); border-radius:var(--radius-md);">
      <div style="font-size:12px; font-weight:600; color:var(--slate-600);">${icon} ${label}</div>
      <div class="font-mono" style="font-size:18px; font-weight:800;">${fmtRp(amount)}</div>
      <div style="font-size:11px; color:var(--slate-500);">${Number(count || 0)} transaksi</div>
    </div>`;

  const txRows = transactions.length > 0 ? transactions.map(t => `
    <tr>
      <td><span class="font-mono">${esc(t.nomor)}</span></td>
      <td>${esc((t.tanggal || '').split(' ')[1] || '-')}</td>
      <td><strong>${esc(t.kasir_nama) || 'Kasir'}</strong></td>
      <td class="font-mono" style="font-weight:700; color:var(--cobalt-700);">${fmtRp(t.total)}</td>
      <td><span class="badge badge-slate">${esc(t.metode_bayar)}</span></td>
    </tr>
  `).join('') : `<tr><td colspan="5" class="text-center" style="padding:20px; color:var(--slate-400);">Belum ada transaksi penjualan pada tanggal ini</td></tr>`;

  return `
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">TOTAL OMZET</div>
          <div class="stat-value">${fmtRp(totalOmzet)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">TOTAL HPP (MODAL)</div>
          <div class="stat-value" style="color:var(--slate-600);">${fmtRp(totalHpp)}</div>
        </div>
        <div class="stat-card" style="background:var(--emerald-50); border-color:var(--emerald-100);">
          <div class="stat-label" style="color:var(--emerald-700);">TOTAL LABA KOTOR</div>
          <div class="stat-value" style="color:var(--emerald-700);">${fmtRp(labaKotor)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">JUMLAH TRANSAKSI</div>
          <div class="stat-value">${jumlahTrx} Struk</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Breakdown per Metode Pembayaran</div></div>
        <div class="grid-4">
          ${methodBox('💵', 'TUNAI', summary.tunai, summary.tunai_count)}
          ${methodBox('🏦', 'TRANSFER', summary.transfer, summary.transfer_count)}
          ${methodBox('📱', 'QRIS', summary.qris, summary.qris_count)}
          ${methodBox('🧾', 'KREDIT', summary.kredit, summary.kredit_count)}
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>No. TRX</th>
              <th>Jam</th>
              <th>Kasir</th>
              <th>Total Nominal</th>
              <th>Metode Bayar</th>
            </tr>
          </thead>
          <tbody>${txRows}</tbody>
        </table>
      </div>
  `;
}

// 2. Laporan Barang Terlaris Top 10 (dengan filter periode)
async function renderLaporanTerlaris(dateFrom, dateTo, sort = 'quantity') {
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const from = dateFrom || firstOfMonthStr();
  const to = dateTo || todayStr();

  const data = await store.getLaporanTerlaris(from, to, sort);
  const products = (data?.products || []).slice(0, 10);
  const barangList = await store.getBarang();

  const rowsHtml = products.length > 0 ? products.map((p, idx) => {
    const b = barangList.find(x => x.id === Number(p.id));
    return `
      <tr>
        <td><span class="badge ${idx === 0 ? 'badge-amber' : 'badge-slate'} font-mono">Rank #${idx + 1}</span></td>
        <td>
          <strong>${esc(p.nama)}</strong>
          <div style="font-size:11px; color:var(--slate-500);">${esc(p.kategori) || ''} · ${esc(p.merek) || ''}</div>
        </td>
        <td class="font-mono text-center"><strong>${Number(p.total_terjual)}</strong> Unit</td>
        <td class="font-mono" style="font-weight:700; color:var(--cobalt-700);">${fmtRp(p.total_revenue)}</td>
        <td class="font-mono" style="font-weight:700; color:var(--emerald-600);">${fmtRp(p.total_laba)}</td>
        <td class="font-mono text-center">${b ? b.stok : '-'} Unit</td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="6" class="text-center" style="padding:30px; color:var(--slate-400);">Belum ada data penjualan pada periode ini</td></tr>`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">🏆 Laporan 10 Barang Terlaris (Top Selling)</h2>
          <p style="font-size:13px; color:var(--slate-500);">Evaluasi produk terlaris berdasarkan kuantitas penjualan & kontribusi laba kotor.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:end;">
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:11px;">Dari</label>
            <input type="date" id="terlaris-from" class="form-control font-mono" style="padding:6px 10px; font-size:13px;" value="${esc(from)}">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:11px;">Sampai</label>
            <input type="date" id="terlaris-to" class="form-control font-mono" style="padding:6px 10px; font-size:13px;" value="${esc(to)}">
          </div>
          <button id="terlaris-filter-btn" class="btn btn-primary btn-sm">Tampilkan</button>
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <span style="font-size:12px; color:var(--slate-500); font-weight:600;">Urutkan:</span>
        <button class="btn btn-sm ${sort === 'quantity' ? 'btn-primary' : 'btn-secondary'} terlaris-sort-btn" data-sort="quantity">📦 Qty</button>
        <button class="btn btn-sm ${sort === 'revenue' ? 'btn-primary' : 'btn-secondary'} terlaris-sort-btn" data-sort="revenue">💰 Omzet</button>
        <button class="btn btn-sm ${sort === 'profit' ? 'btn-primary' : 'btn-secondary'} terlaris-sort-btn" data-sort="profit">📈 Laba</button>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Nama Produk</th>
              <th class="text-center">Terjual (Qty)</th>
              <th>Total Omzet</th>
              <th>Laba Kotor</th>
              <th class="text-center">Sisa Stok</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('terlaris-filter-btn')?.addEventListener('click', async () => {
      const f = document.getElementById('terlaris-from').value;
      const t = document.getElementById('terlaris-to').value;
      if (!f || !t) { showToast('Pilih rentang tanggal dulu.', 'error'); return; }
      const contentArea = document.querySelector('.app-content');
      if (contentArea) contentArea.innerHTML = await renderLaporanTerlaris(f, t, sort);
    });

    document.querySelectorAll('.terlaris-sort-btn').forEach(btn => {
      btn.onclick = async () => {
        const f = document.getElementById('terlaris-from').value;
        const t = document.getElementById('terlaris-to').value;
        const contentArea = document.querySelector('.app-content');
        if (contentArea) contentArea.innerHTML = await renderLaporanTerlaris(f, t, btn.dataset.sort);
      };
    });
  }, 0);

  return html;
}

// 3. Laporan Stok Menipis
async function renderLaporanStokMenipis() {
  const lowStock = await store.getLaporanStokMenipis();

  const rowsHtml = lowStock.length > 0 ? lowStock.map(b => {
    const isOut = Number(b.stok) === 0;
    return `
      <tr class="${isOut ? 'row-pink-alert' : 'row-amber-alert'}">
        <td><span class="font-mono">${esc(b.kode)}</span></td>
        <td><strong>${esc(b.nama)}</strong></td>
        <td>${esc(b.kategori) || '-'}</td>
        <td>${esc(b.merek) || '-'}</td>
        <td class="font-mono text-center"><span class="badge ${isOut ? 'badge-crimson' : 'badge-amber'}">${b.stok} ${esc(b.satuan)}</span></td>
        <td class="font-mono text-center">${b.stok_minimum} ${esc(b.satuan)}</td>
        <td><a href="#/pembelian" class="btn btn-sm btn-primary">📥 Restock</a></td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="7" class="text-center" style="padding:30px; color:var(--emerald-600); font-weight:700;">✓ Semua stok produk mencukupi di atas batas minimum!</td></tr>`;

  return `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div>
        <h2 style="font-size:20px; font-weight:800;">⚠️ Laporan Warning Stok Menipis</h2>
        <p style="font-size:13px; color:var(--slate-500);">Daftar barang dengan sisa stok &lt;= stok minimum untuk prioritas restock supplier.</p>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Merek</th>
              <th class="text-center">Stok Saat Ini</th>
              <th class="text-center">Batas Minimum</th>
              <th>Aksi Restock</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

// 4. Laporan Kas Harian
async function renderLaporanKas() {
  const tanggal = todayStr();
  const data = await store.getLaporanKasHarian(tanggal);

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:20px; font-weight:800;">💰 Laporan Arus Kas Harian</h2>
          <p style="font-size:13px; color:var(--slate-500);">Arus kas tunai murni: penjualan tunai + bayar piutang − pembelian tunai − bayar hutang.</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="date" id="kas-tanggal" class="form-control" value="${tanggal}" max="${tanggal}" style="width:auto;">
          <button id="kas-tampil-btn" class="btn btn-primary">Tampilkan</button>
        </div>
      </div>
      <div id="kas-content">${kasCardsHtml(data)}</div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById('kas-tampil-btn')?.addEventListener('click', async () => {
      const t = document.getElementById('kas-tanggal').value || tanggal;
      const btn = document.getElementById('kas-tampil-btn');
      btn.disabled = true;
      btn.textContent = 'Memuat...';
      try {
        const d = await store.getLaporanKasHarian(t);
        document.getElementById('kas-content').innerHTML = kasCardsHtml(d);
      } catch (err) {
        showToast(err.message || 'Gagal memuat laporan kas.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Tampilkan';
      }
    });
  }, 0);

  return html;
}

function kasCardsHtml(data) {
  const kasMasuk   = Number(data?.kas_masuk || 0);
  const kasKeluar  = Number(data?.kas_keluar || 0);
  const selisih    = Number(data?.selisih || 0);
  const good = selisih >= 0;
  const color = good ? 'var(--emerald-700)' : 'var(--crimson-700)';
  const bg = good ? 'var(--emerald-50)' : 'var(--crimson-50)';
  const border = good ? 'var(--emerald-100)' : 'var(--crimson-100)';

  return `
      <div class="grid-3">
        <div class="stat-card" style="background:var(--emerald-50); border-color:var(--emerald-100);">
          <div class="stat-label" style="color:var(--emerald-700);">KAS MASUK (TUNAI)</div>
          <div class="stat-value" style="color:var(--emerald-700);">+ ${fmtRp(kasMasuk)}</div>
          <div style="font-size:11px; color:var(--slate-500); margin-top:4px;">Penjualan tunai + bayar piutang tunai</div>
        </div>
        <div class="stat-card" style="background:var(--crimson-50); border-color:var(--crimson-100);">
          <div class="stat-label" style="color:var(--crimson-700);">KAS KELUAR (TUNAI)</div>
          <div class="stat-value" style="color:var(--crimson-700);">− ${fmtRp(kasKeluar)}</div>
          <div style="font-size:11px; color:var(--slate-500); margin-top:4px;">Pembelian tunai + bayar hutang tunai</div>
        </div>
        <div class="stat-card" style="background:${bg}; border-color:${border};">
          <div class="stat-label" style="color:${color};">SELISIH HARI INI</div>
          <div class="stat-value" style="color:${color};">${good ? '+' : '−'} ${fmtRp(Math.abs(selisih))}</div>
          <div style="font-size:11px; color:var(--slate-500); margin-top:4px;">Kas masuk − kas keluar</div>
        </div>
      </div>
  `;
}
