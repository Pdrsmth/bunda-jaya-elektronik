// Sidebar Navigation Component

import { store } from '../store.js';
import { esc } from '../utils/helpers.js';

// ── SVG icons (Lucide style, 20×20 viewBox) ──────────────────────────────────
const icons = {
  dashboard:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  pos:        `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  barang:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><line x1="12" y1="22" x2="12" y2="12"/></svg>`,
  supplier:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>`,
  pembelian:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  hutang:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  piutang:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  transaksi:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  laporan:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  penjualan:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  terlaris:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  stok:       `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  kas:        `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  logout:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  menu:       `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  chevronDown:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  operasional:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  pengguna:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
let _groupCounter = 0;

function navItem(path, label, iconKey, currentPath) {
  const isActive = currentPath === path || currentPath.startsWith(path + '/');
  return `
    <li>
      <a href="#${path}" class="nav-link ${isActive ? 'active' : ''}">
        <span class="icon">${icons[iconKey] || icons.barang}</span>
        <span class="nav-text">${label}</span>
      </a>
    </li>`;
}

function navGroup(groupLabel, iconKey, items, currentPath) {
  const id = `ng-${++_groupCounter}`;
  const isOpen = items.some(i => currentPath === i.path || currentPath.startsWith(i.path + '/'));
  return `
    <li class="nav-group">
      <input type="checkbox" class="nav-radio" id="${id}" ${isOpen ? 'checked' : ''}>
      <label for="${id}" class="nav-link nav-group-label">
        <span class="icon">${icons[iconKey] || icons.operasional}</span>
        <span class="nav-text">${groupLabel}</span>
        <span class="chevron">${icons.chevronDown}</span>
      </label>
      <div class="sub-menu">
        <ul>
          ${items.map(i => navItem(i.path, i.label, i.icon, currentPath)).join('')}
        </ul>
      </div>
    </li>`;
}

// ── Main render ───────────────────────────────────────────────────────────────
export function renderSidebar(currentPath) {
  _groupCounter = 0;
  const user   = store.getCurrentUser();
  const role   = user.role;
  const isOwner = role === 'Owner';
  const isAdmin = role === 'Admin' || isOwner;
  const isKasir = role === 'Kasir' || isAdmin;
  const displayName = user.name || user.nama || 'User';

  let nav = '';

  nav += navItem('/dashboard', 'Dashboard', 'dashboard', currentPath);
  if (isKasir) nav += navItem('/pos', 'Transaksi POS', 'pos', currentPath);

  if (isAdmin) {
    nav += `<li class="section-label">OPERASIONAL</li>`;
    nav += navGroup('Barang & Stok', 'operasional', [
      { path: '/barang',    label: 'Master Barang', icon: 'barang' },
      { path: '/pembelian', label: 'Stok Masuk',    icon: 'pembelian' },
    ], currentPath);
    nav += navGroup('Supplier & Hutang', 'supplier', [
      { path: '/supplier', label: 'Supplier',        icon: 'supplier' },
      { path: '/hutang',   label: 'Hutang Supplier', icon: 'hutang' },
    ], currentPath);
    nav += navGroup('Piutang Pelanggan', 'piutang', [
      { path: '/piutang', label: 'Piutang (Kredit)', icon: 'piutang' },
    ], currentPath);
    nav += navItem('/transaksi', 'Histori Penjualan', 'transaksi', currentPath);
  }

  if (isOwner) {
    nav += `<li class="section-label">LAPORAN</li>`;
    nav += navGroup('Laporan', 'laporan', [
      { path: '/laporan/penjualan',    label: 'Penjualan Harian', icon: 'penjualan' },
      { path: '/laporan/terlaris',     label: 'Barang Terlaris',  icon: 'terlaris'  },
      { path: '/laporan/stok-menipis', label: 'Stok Menipis',     icon: 'stok'      },
      { path: '/laporan/kas',          label: 'Kas Harian',       icon: 'kas'       },
    ], currentPath);
    nav += `<li class="section-label">PENGATURAN</li>`;
    nav += navItem('/pengguna', 'Kelola Pengguna', 'pengguna', currentPath);
  }

  const roleLabel = { Owner: 'Owner', Admin: 'Admin', Kasir: 'Kasir' }[role] || role;

  return `
    <div class="sidebar-header">
      <div class="brand-icon-new">⚡</div>
      <div class="sidebar-brand-text">
        <div class="brand-title-new">Bunda Jaya</div>
        <div class="brand-sub-new">Elektronik POS</div>
      </div>
      <button id="sidebar-toggle-btn" class="sidebar-hamburger" title="Toggle Sidebar">
        ${icons.menu}
      </button>
    </div>

    <nav class="nav">
      <ul>
        ${nav}
        <li class="nav-spacer"></li>
        <li>
          <button id="sidebar-logout-btn" class="nav-link logout-link">
            <span class="icon">${icons.logout}</span>
            <span class="nav-text">Keluar</span>
          </button>
        </li>
      </ul>
    </nav>

    <div class="sidebar-user">
      <div class="user-avatar-new">${displayName.charAt(0).toUpperCase()}</div>
      <div class="user-info-new">
        <div class="user-name-new">${esc(displayName)}</div>
        <div class="user-role-new">${roleLabel}</div>
      </div>
    </div>
  `;
}
