// Dashboard View Component

import { store } from '../store.js';
import { esc, formatRupiah as fmtRp, num } from '../utils/helpers.js';

function fmtRpShort(n) {
  n = Number(n || 0);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'M';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'jt';
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + 'rb';
  return n.toString();
}

function barChart(data) {
  if (!data || data.length === 0) {
    return `<div style="padding:32px;text-align:center;color:var(--slate-400);font-size:13px;">Belum ada data penjualan</div>`;
  }

  const maxVal = Math.max(...data.map(d => d.omzet), 1);
  const barH   = 100; // max bar height px

  const bars = data.map(d => {
    const pct   = maxVal > 0 ? (d.omzet / maxVal) * 100 : 0;
    const label = d.label ? d.label.split(',')[0] : '';
    const hasValue = d.omzet > 0;
    return `
      <div class="db-bar-col">
        <div class="db-bar-label-top">${hasValue ? fmtRpShort(d.omzet) : ''}</div>
        <div class="db-bar-track">
          <div class="db-bar-fill" style="height:${pct}%;" title="${d.label}: ${fmtRp(d.omzet)}"></div>
        </div>
        <div class="db-bar-label-bot">${label}</div>
        ${d.count > 0 ? `<div class="db-bar-count">${d.count}x</div>` : '<div class="db-bar-count"></div>'}
      </div>`;
  }).join('');

  return `<div class="db-bar-chart">${bars}</div>`;
}

export async function renderDashboard() {
  const metrics = await store.getDashboardMetrics();
  const user    = store.getCurrentUser();

  // ── Stat cards ─────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Omzet Hari Ini',
      value: fmtRp(metrics.totalOmzetToday),
      sub: `${metrics.totalTransactionsToday} transaksi`,
      accent: 'cobalt',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    },
    {
      label: 'Laba Kotor',
      value: fmtRp(metrics.totalLabaKotorToday),
      sub: 'Omzet − HPP',
      accent: 'emerald',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    },
    {
      label: 'Transaksi',
      value: metrics.totalTransactionsToday,
      sub: 'Struk hari ini',
      accent: 'violet',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    },
    {
      label: 'Stok Menipis',
      value: metrics.lowStockCount,
      sub: metrics.lowStockCount > 0 ? 'Perlu restock!' : 'Semua aman',
      accent: metrics.lowStockCount > 0 ? 'amber' : 'emerald',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    },
    {
      label: 'Piutang Aktif',
      value: fmtRp(metrics.piutangAktifTotal),
      sub: `${metrics.piutangAktifCount} pelanggan belum lunas`,
      accent: metrics.piutangAktifCount > 0 ? 'amber' : 'emerald',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    },
  ];

  const statCardsHtml = stats.map(s => `
    <div class="db-stat-card db-stat-${s.accent}">
      <div class="db-stat-icon">${s.icon}</div>
      <div class="db-stat-body">
        <div class="db-stat-label">${esc(s.label)}</div>
        <div class="db-stat-value">${s.value}</div>
        <div class="db-stat-sub">${esc(s.sub)}</div>
      </div>
    </div>`).join('');

  // ── Top products ────────────────────────────────────────────────────
  const topRows = metrics.topProducts.length > 0
    ? metrics.topProducts.slice(0, 5).map((p, i) => `
        <tr>
          <td style="width:32px;">
            <span class="db-rank ${i === 0 ? 'db-rank-gold' : ''}">${i + 1}</span>
          </td>
          <td style="font-weight:600;font-size:13px;">${esc(p.name || p.nama)}</td>
          <td class="font-mono" style="text-align:right;font-size:12px;white-space:nowrap;">${p.qty || p.total_qty} Unit</td>
          <td class="font-mono" style="text-align:right;font-size:12px;white-space:nowrap;color:var(--cobalt-700);font-weight:700;">${fmtRpShort(p.revenue || p.total_revenue)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--slate-400);font-size:13px;">Belum ada data penjualan</td></tr>`;

  // ── Low stock ───────────────────────────────────────────────────────
  const lowRows = metrics.lowStockItems.length > 0
    ? metrics.lowStockItems.slice(0, 5).map(b => {
        const isOut = b.stok === 0;
        return `
          <tr>
            <td style="font-size:11px;font-family:var(--font-mono);color:var(--slate-500);">${b.kode}</td>
            <td style="font-size:13px;font-weight:500;">${esc(b.nama)}</td>
            <td style="text-align:right;">
              <span class="badge ${isOut ? 'badge-crimson' : 'badge-amber'}">${b.stok} ${b.satuan}</span>
            </td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--emerald-600);font-size:13px;font-weight:600;">✓ Semua stok aman</td></tr>`;

  // ── Active debts ────────────────────────────────────────────────────
  const debtRows = metrics.activeDebts.length > 0
    ? metrics.activeDebts.slice(0, 4).map(h => {
        const isOverdue = h.isOverdue || (h.jatuh_tempo && new Date(h.jatuh_tempo) < new Date());
        return `
          <tr>
            <td style="font-size:12px;font-weight:600;">${esc(h.supplier_nama)}</td>
            <td class="font-mono" style="text-align:right;font-size:12px;font-weight:700;color:var(--crimson-600);">${fmtRpShort(h.sisa_hutang)}</td>
            <td>
              <span class="badge ${isOverdue ? 'badge-crimson' : 'badge-amber'}" style="font-size:10px;">
                ${isOverdue ? 'Terlambat' : h.jatuh_tempo}
              </span>
            </td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--emerald-600);font-size:13px;font-weight:600;">✓ Tidak ada hutang jatuh tempo</td></tr>`;

  return `
    <div class="db-root">

      <!-- Welcome bar -->
      <div class="db-welcome">
        <div>
          <div class="db-welcome-title">Halo, ${esc(user.name || user.nama || 'Admin')} 👋</div>
          <div class="db-welcome-sub">Bunda Jaya Elektronik — ${new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
        <div class="db-welcome-actions">
          <a href="#/pos" class="btn btn-primary">🛒 Buka POS</a>
          ${user.role !== 'Kasir' ? `<a href="#/pembelian" class="btn btn-secondary">📥 Stok Masuk</a>` : ''}
        </div>
      </div>

      <!-- Stat cards -->
      <div class="db-stats">${statCardsHtml}</div>

      <!-- Chart + tables -->
      <div class="db-main-grid">

        <!-- Left col: chart + top products -->
        <div class="db-col">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Tren Omzet 7 Hari</div>
              <span class="badge badge-slate">Live</span>
            </div>
            ${barChart(metrics.chartData)}
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Top 5 Produk Terlaris</div>
              <a href="#/laporan/terlaris" class="db-link">Lihat semua →</a>
            </div>
            <div class="table-container" style="box-shadow:none;border:none;">
              <table class="data-table">
                <thead><tr><th>#</th><th>Produk</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Omzet</th></tr></thead>
                <tbody>${topRows}</tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right col: low stock + debts -->
        <div class="db-col">
          <div class="card">
            <div class="card-header">
              <div class="card-title">⚠ Stok Menipis</div>
              <a href="#/laporan/stok-menipis" class="db-link">Detail →</a>
            </div>
            <div class="table-container" style="box-shadow:none;border:none;">
              <table class="data-table">
                <thead><tr><th>Kode</th><th>Barang</th><th style="text-align:right;">Stok</th></tr></thead>
                <tbody>${lowRows}</tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">💳 Hutang Jatuh Tempo</div>
              <a href="#/hutang" class="db-link">Kelola →</a>
            </div>
            <div class="table-container" style="box-shadow:none;border:none;">
              <table class="data-table">
                <thead><tr><th>Supplier</th><th style="text-align:right;">Sisa</th><th>Status</th></tr></thead>
                <tbody>${debtRows}</tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>`;
}
