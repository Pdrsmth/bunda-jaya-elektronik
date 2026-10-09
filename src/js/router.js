// Hash Router & SPA View Engine

import { store } from './store.js';
import { renderSidebar } from './components/sidebar.js';
import { renderNavbar, attachNavbarEvents } from './components/navbar.js';
import { showToast } from './components/toast.js';

import { renderDashboard } from './views/dashboard.js';
import { renderPOS } from './views/pos.js';
import { renderBarang } from './views/barang.js';
import { renderSupplier } from './views/supplier.js';
import { renderPembelian } from './views/pembelian.js';
import { renderHutang } from './views/hutang.js';
import { renderPiutang } from './views/piutang.js';
import { renderTransaksi } from './views/transaksi.js';
import { renderLaporan } from './views/laporan.js';
import { renderPengguna } from './views/pengguna.js';
import { renderLogin, attachLoginEvents } from './views/login.js';

const routes = {
  '/login': { title: 'Login', render: renderLogin, role: 'Public' },
  '/dashboard': { title: 'Dashboard Operasional', render: renderDashboard, role: 'All' },
  '/pos': { title: 'Transaksi POS Kasir', render: renderPOS, role: 'Kasir' },
  '/barang': { title: 'Master Data Barang', render: renderBarang, role: 'Admin' },
  '/supplier': { title: 'Master Data Supplier', render: renderSupplier, role: 'Admin' },
  '/pembelian': { title: 'Stok Masuk (Pembelian)', render: renderPembelian, role: 'Admin' },
  '/hutang': { title: 'Manajemen Hutang Supplier', render: renderHutang, role: 'Admin' },
  '/piutang': { title: 'Piutang Pelanggan (Kredit)', render: renderPiutang, role: 'Admin' },
  '/transaksi': { title: 'Histori Penjualan', render: renderTransaksi, role: 'Kasir' },
  '/laporan/penjualan': { title: 'Laporan Penjualan Harian', render: () => renderLaporan('/laporan/penjualan'), role: 'Owner' },
  '/laporan/terlaris': { title: 'Laporan Barang Terlaris', render: () => renderLaporan('/laporan/terlaris'), role: 'Owner' },
  '/laporan/stok-menipis': { title: 'Laporan Stok Menipis', render: () => renderLaporan('/laporan/stok-menipis'), role: 'Owner' },
  '/laporan/kas': { title: 'Laporan Rekonsiliasi Kas', render: () => renderLaporan('/laporan/kas'), role: 'Owner' },
  '/pengguna': { title: 'Kelola Pengguna', render: renderPengguna, role: 'Owner' }
};

// ── Sidebar Collapse State ─────────────────────────────────────────────────
const SIDEBAR_KEY = 'bje_sidebar_collapsed';

function isSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_KEY) === 'true';
}

function setSidebarCollapsed(val) {
  localStorage.setItem(SIDEBAR_KEY, String(val));
}

function applySidebarState() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  if (window.innerWidth <= 768) {
    // Mobile: toggle sidebar-open class
    if (isSidebarCollapsed()) {
      appEl.classList.remove('sidebar-open');
    } else {
      appEl.classList.add('sidebar-open');
    }
    appEl.classList.remove('sidebar-collapsed');
  } else {
    // Desktop: toggle sidebar-collapsed class
    if (isSidebarCollapsed()) {
      appEl.classList.add('sidebar-collapsed');
    } else {
      appEl.classList.remove('sidebar-collapsed');
    }
    appEl.classList.remove('sidebar-open');
  }
}

function initHamburger() {
  const btn = document.getElementById('sidebar-toggle-btn');
  if (!btn) return;

  // Reflect current open/close state on the button
  if (isSidebarCollapsed()) {
    btn.classList.add('is-active');
  } else {
    btn.classList.remove('is-active');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click from immediately closing it
    const next = !isSidebarCollapsed();
    setSidebarCollapsed(next);
    applySidebarState();

    if (next) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });
}
// ──────────────────────────────────────────────────────────────────────────

export function initRouter() {
  // Global click listener for mobile sidebar overlay
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !isSidebarCollapsed()) {
      const sidebar = document.getElementById('app-sidebar');
      const btn = document.getElementById('sidebar-toggle-btn');
      if (sidebar && !sidebar.contains(e.target) && (!btn || !btn.contains(e.target))) {
        setSidebarCollapsed(true);
        applySidebarState();
        if (btn) btn.classList.add('is-active');
      }
    }
  });

  // Check session on initial load
  checkSessionOnStart().then((hasSession) => {
    // After session check, handle initial route
    if (!hasSession) {
      // No session, redirect to login
      window.location.hash = '#/login';
    }
    handleRoute();
    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);
  });
}

async function checkSessionOnStart() {
  try {
    const user = await store.checkSession();
    console.log('Session check complete:', user);
    return !!user;
  } catch (error) {
    console.log('No active session');
    return false;
  }
}

async function handleRoute() {
  let hash = window.location.hash.slice(1);
  if (!hash || hash === '/') hash = '/dashboard';

  const user = store.getCurrentUser();
  const isLoggedIn = user && user.username !== 'guest';
  
  // If not logged in and trying to access protected route, redirect to login
  if (!isLoggedIn && hash !== '/login') {
    window.location.hash = '#/login';
    return;
  }
  
  // If logged in and trying to access login page, redirect to dashboard
  if (isLoggedIn && hash === '/login') {
    window.location.hash = '#/dashboard';
    return;
  }

  // Access Control Check
  let routeObj = routes[hash];
  if (!routeObj) {
    hash = isLoggedIn ? '/dashboard' : '/login';
    routeObj = routes[hash];
  }

  // Special handling for login page (no sidebar/header)
  if (hash === '/login') {
    // Hide sidebar and header, make content fill the viewport
    const sidebarEl = document.getElementById('app-sidebar');
    const headerEl = document.getElementById('app-header');
    const appMainEl = document.querySelector('.app-main');
    const contentEl = document.getElementById('app-content');
    // Pastikan overlay drawer mobile tidak nyangkut di halaman login
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.remove('sidebar-open');

    if (sidebarEl) sidebarEl.style.display = 'none';
    if (headerEl) headerEl.style.display = 'none';
    if (appMainEl) appMainEl.style.minHeight = '100vh';

    if (contentEl) {
      contentEl.style.padding = '0';
      contentEl.style.overflow = 'auto';
      contentEl.innerHTML = renderLogin();
      attachLoginEvents();
    }
    return;
  }

  // Restore normal layout for authenticated pages
  const appMainEl = document.querySelector('.app-main');
  if (appMainEl) appMainEl.style.minHeight = '';

  // Show sidebar and header for authenticated pages
  const sidebarEl = document.getElementById('app-sidebar');
  const headerEl = document.getElementById('app-header');
  const contentEl = document.getElementById('app-content');
  
  if (sidebarEl) {
    sidebarEl.style.display = 'flex';
    sidebarEl.innerHTML = renderSidebar(hash);
  }
  if (headerEl) {
    headerEl.style.display = 'flex';
    headerEl.innerHTML = renderNavbar(routeObj.title);
  }
  if (contentEl) {
    contentEl.style.padding = '24px';
  }

  // Auto-collapse sidebar on mobile when navigating
  if (window.innerWidth <= 768) {
    setSidebarCollapsed(true);
  }

  const role = user.role;

  // Role-based access control
  const ownerOnlyRoutes = ['/laporan/penjualan', '/laporan/terlaris', '/laporan/stok-menipis', '/laporan/kas', '/pengguna'];
  const adminRoutes = ['/barang', '/supplier', '/pembelian', '/hutang', '/piutang'];
  const kasirRoutes = ['/pos', '/transaksi'];

  if (role === 'Kasir' && (adminRoutes.includes(hash) || ownerOnlyRoutes.includes(hash))) {
    showToast('Akses ditolak. Hubungi Owner atau Admin.', 'error');
    window.location.hash = '#/pos';
    return;
  }

  if (role === 'Admin' && ownerOnlyRoutes.includes(hash)) {
    showToast('Akses ditolak. Laporan hanya untuk Owner.', 'error');
    window.location.hash = '#/dashboard';
    return;
  }

  // Render content with loading state
  if (contentEl) {
    contentEl.innerHTML = '<div style="padding:40px; text-align:center; color:#64748b;">Loading...</div>';
    
    // Call render function (may be async)
    Promise.resolve(routeObj.render()).then(html => {
      contentEl.innerHTML = html;
    }).catch(error => {
      console.error('Render error:', error);
      contentEl.innerHTML = `<div style="padding:40px; text-align:center; color:#dc2626;">Error loading page: ${error.message}</div>`;
    });
  }

  // Apply persistent sidebar state after re-rendering sidebar
  applySidebarState();

  // Attach events after render
  setTimeout(() => {
    // Hamburger toggle
    initHamburger();

    // Ganti password — navbar button
    attachNavbarEvents();

    // Logout — navbar button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (confirm('Yakin ingin keluar dari sistem?')) {
          store.logout();
        }
      };
    }

    // Logout — sidebar button
    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.onclick = () => {
        if (confirm('Yakin ingin keluar dari sistem?')) {
          store.logout();
        }
      };
    }
  }, 0);
}
