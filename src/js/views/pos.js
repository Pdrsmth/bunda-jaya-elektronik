// POS Transaksi Kasir View Component

import { store } from '../store.js';
import { showToast } from '../components/toast.js';
import { renderReceiptModal } from '../components/receipt.js';
import { generateIdempotencyKey, esc, num } from '../utils/helpers.js';

let cart = [];
let activeCategory = 'Semua';
let searchQuery = '';
let discountType = 'Nominal';
let discountVal = 0;
let paymentMethod = 'Tunai';
let paidAmount = 0;
let pelangganNama = '';
let pelangganKontak = '';
let cachedBarangList = [];
let cachedKategoriList = [];

// ─── Computed values (recalculated whenever state changes) ───────────────────
function calcTotals() {
  const subtotal = cart.reduce((acc, i) => acc + (i.harga_jual * i.qty), 0);
  let discountAmount = 0;
  if (discountType === 'Persen') {
    discountAmount = (subtotal * (Number(discountVal) || 0)) / 100;
  } else {
    discountAmount = Number(discountVal) || 0;
  }
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const change = paymentMethod === 'Tunai' ? Math.max(0, (paidAmount || 0) - grandTotal) : 0;
  return { subtotal, discountAmount, grandTotal, change };
}

// ─── Partial DOM updaters (no full re-render, no focus loss) ─────────────────

function updateProductGrid() {
  const grid = document.getElementById('pos-products-grid');
  if (!grid) return;
  const filtered = cachedBarangList.filter(b => {
    const matchCat = activeCategory === 'Semua' || b.kategori_id === Number(activeCategory);
    const q = searchQuery.toLowerCase();
    return matchCat && (b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q));
  });
  grid.innerHTML = filtered.length > 0 ? filtered.map(b => {
    const isOut = b.stok === 0;
    const isLow = b.stok <= b.stok_minimum;
    const badgeClass = isOut ? 'badge-crimson' : isLow ? 'badge-amber' : 'badge-slate';
    return `
      <div class="product-card ${isOut ? 'disabled' : ''}" data-id="${b.id}">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="product-card-code">${esc(b.kode)}</span>
            <span class="badge ${badgeClass}">${isOut ? 'HABIS' : 'Stok: ' + b.stok}</span>
          </div>
          <div class="product-card-title">${esc(b.nama)}</div>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">Rp ${num(b.harga_jual).toLocaleString('id-ID')}</div>
          <button class="btn btn-sm btn-primary" ${isOut ? 'disabled' : ''}>+ Tambah</button>
        </div>
      </div>`;
  }).join('') : `<div style="padding:40px;text-align:center;color:var(--slate-400);grid-column:1/-1;">Produk tidak ditemukan</div>`;
  attachProductCardEvents();
}

function updateCategoryPills() {
  const container = document.getElementById('pos-category-filters');
  if (!container) return;
  container.innerHTML = [
    `<button class="filter-pill ${activeCategory === 'Semua' ? 'active' : ''}" data-cat="Semua">Semua Produk</button>`,
    ...cachedKategoriList.map(c =>
      `<button class="filter-pill ${activeCategory === String(c.id) ? 'active' : ''}" data-cat="${c.id}">${esc(c.nama)}</button>`)
  ].join('');
  container.querySelectorAll('.filter-pill').forEach(btn => {
    btn.onclick = () => { activeCategory = btn.dataset.cat; updateCategoryPills(); updateProductGrid(); };
  });
}

function updateCart() {
  const { subtotal, discountAmount, grandTotal, change } = calcTotals();

  // Cart header badge
  const cartTitle = document.querySelector('.cart-title');
  if (cartTitle) {
    cartTitle.innerHTML = `🛒 Keranjang Belanja <span class="badge badge-slate">${cart.reduce((a,b)=>a+num(b.qty),0)} item</span>`;
  }

  // Clear-all button
  const cartHeader = document.querySelector('.cart-header');
  if (cartHeader) {
    let clearBtn = cartHeader.querySelector('#clear-cart-btn');
    if (cart.length > 0 && !clearBtn) {
      clearBtn = document.createElement('button');
      clearBtn.id = 'clear-cart-btn';
      clearBtn.className = 'btn btn-sm btn-secondary';
      clearBtn.style.color = 'var(--crimson-600)';
      clearBtn.textContent = 'Hapus Semua';
      cartHeader.appendChild(clearBtn);
      clearBtn.addEventListener('click', () => { cart = []; updateCart(); updateCheckoutBtn(); });
    } else if (cart.length === 0 && clearBtn) {
      clearBtn.remove();
    }
  }

  // Cart items list
  const list = document.getElementById('cart-items-list');
  if (list) {
    list.innerHTML = cart.length > 0 ? cart.map((item, index) => `
      <div class="cart-item-row">
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(item.nama)}</div>
          <div class="cart-item-price">Rp ${num(item.harga_jual).toLocaleString('id-ID')}</div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-stepper">
            <button class="stepper-btn btn-dec" data-index="${index}">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="stepper-btn btn-inc" data-index="${index}">+</button>
          </div>
          <div class="cart-item-subtotal">Rp ${num((item.harga_jual * item.qty)).toLocaleString('id-ID')}</div>
          <button class="cart-item-delete btn-del" data-index="${index}">🗑️</button>
        </div>
      </div>`).join('') : `
      <div class="cart-empty-state">
        <div style="font-size:48px;">🛒</div>
        <div style="font-weight:700;color:var(--slate-700);">Keranjang Kasir Kosong</div>
        <div style="font-size:12px;">Pilih barang dari katalog di sebelah kiri untuk memulai transaksi.</div>
      </div>`;
    attachCartEvents();
  }

  // Summary numbers
  updateTotalsDisplay();
}

function updateTotalsDisplay() {
  const { subtotal, discountAmount, grandTotal, change } = calcTotals();

  const subtotalEl = document.getElementById('pos-subtotal');
  if (subtotalEl) subtotalEl.textContent = `Rp ${num(subtotal).toLocaleString('id-ID')}`;

  const totalEl = document.getElementById('pos-grand-total');
  if (totalEl) totalEl.textContent = `Rp ${num(grandTotal).toLocaleString('id-ID')}`;

  const discountLabelEl = document.getElementById('pos-discount-label');
  if (discountLabelEl) discountLabelEl.textContent = discountAmount > 0 ? `(Hemat Rp ${num(discountAmount).toLocaleString('id-ID')})` : '';

  const changeEl = document.getElementById('pos-change');
  if (changeEl) changeEl.textContent = `Rp ${num(change).toLocaleString('id-ID')}`;

  // Auto-fill paid amount for non-cash (kecuali Kredit: DP diisi manual)
  const paidInput = document.getElementById('paid-amount-input');
  if (paidInput && paymentMethod !== 'Tunai' && paymentMethod !== 'Kredit') {
    paidInput.value = grandTotal;
    paidAmount = grandTotal;
  }
}

function updateCheckoutBtn() {
  const btn = document.getElementById('checkout-btn');
  if (btn) btn.disabled = cart.length === 0;
}

// ─── Event attachment helpers ────────────────────────────────────────────────

function attachProductCardEvents() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.onclick = () => {
      const id = Number(card.dataset.id);
      const item = cachedBarangList.find(b => b.id === id);
      if (!item || item.stok <= 0) return;
      const idx = cart.findIndex(c => c.id === id);
      if (idx !== -1) {
        if (cart[idx].qty + 1 > item.stok) {
          showToast(`Stok ${esc(item.nama)} tidak mencukupi (Max: ${item.stok})`, 'error');
          return;
        }
        cart[idx].qty += 1;
      } else {
        cart.push({ ...item, qty: 1 });
      }
      updateCart();
      updateCheckoutBtn();
    };
  });
}

function attachCartEvents() {
  document.querySelectorAll('.btn-inc').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      const item = cachedBarangList.find(b => b.id === cart[idx].id);
      if (item && cart[idx].qty + 1 > item.stok) {
        showToast(`Stok ${esc(item.nama)} hanya tersisa ${item.stok}`, 'error');
        return;
      }
      cart[idx].qty += 1;
      updateCart();
      updateCheckoutBtn();
    };
  });

  document.querySelectorAll('.btn-dec').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      if (cart[idx].qty > 1) { cart[idx].qty -= 1; } else { cart.splice(idx, 1); }
      updateCart();
      updateCheckoutBtn();
    };
  });

  document.querySelectorAll('.btn-del').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      cart.splice(Number(btn.dataset.index), 1);
      updateCart();
      updateCheckoutBtn();
    };
  });
}

// ─── Main render (runs once on page load) ────────────────────────────────────

export async function renderPOS() {
  cachedBarangList  = await store.getBarang();
  cachedKategoriList = await store.getKategori();

  const { subtotal, discountAmount, grandTotal, change } = calcTotals();

  const productsGridHtml = cachedBarangList.filter(b => {
    const matchCat = activeCategory === 'Semua' || b.kategori_id === Number(activeCategory);
    const q = searchQuery.toLowerCase();
    return matchCat && (b.nama.toLowerCase().includes(q) || b.kode.toLowerCase().includes(q));
  }).map(b => {
    const isOut = b.stok === 0;
    const isLow = b.stok <= b.stok_minimum;
    const badgeClass = isOut ? 'badge-crimson' : isLow ? 'badge-amber' : 'badge-slate';
    return `
      <div class="product-card ${isOut ? 'disabled' : ''}" data-id="${b.id}">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="product-card-code">${esc(b.kode)}</span>
            <span class="badge ${badgeClass}">${isOut ? 'HABIS' : 'Stok: ' + b.stok}</span>
          </div>
          <div class="product-card-title">${esc(b.nama)}</div>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">Rp ${num(b.harga_jual).toLocaleString('id-ID')}</div>
          <button class="btn btn-sm btn-primary" ${isOut ? 'disabled' : ''}>+ Tambah</button>
        </div>
      </div>`;
  }).join('');

  const catPillsHtml = [
    `<button class="filter-pill ${activeCategory === 'Semua' ? 'active' : ''}" data-cat="Semua">Semua Produk</button>`,
    ...cachedKategoriList.map(c =>
      `<button class="filter-pill ${activeCategory === String(c.id) ? 'active' : ''}" data-cat="${c.id}">${esc(c.nama)}</button>`)
  ].join('');

  const cartRowsHtml = cart.length > 0 ? cart.map((item, index) => `
    <div class="cart-item-row">
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.nama)}</div>
        <div class="cart-item-price">Rp ${num(item.harga_jual).toLocaleString('id-ID')}</div>
      </div>
      <div class="cart-item-controls">
        <div class="qty-stepper">
          <button class="stepper-btn btn-dec" data-index="${index}">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="stepper-btn btn-inc" data-index="${index}">+</button>
        </div>
        <div class="cart-item-subtotal">Rp ${num((item.harga_jual * item.qty)).toLocaleString('id-ID')}</div>
        <button class="cart-item-delete btn-del" data-index="${index}">🗑️</button>
      </div>
    </div>`).join('') : `
    <div class="cart-empty-state">
      <div style="font-size:48px;">🛒</div>
      <div style="font-weight:700;color:var(--slate-700);">Keranjang Kasir Kosong</div>
      <div style="font-size:12px;">Pilih barang dari katalog untuk memulai transaksi.</div>
    </div>`;

  const html = `
    <div class="pos-container">
      <!-- Left Panel -->
      <div class="pos-catalog-panel">
        <div class="pos-search-bar">
          <div class="pos-search-input-wrapper">
            <span class="pos-search-icon">🔍</span>
            <input type="text" id="pos-search-input" class="pos-search-input"
              placeholder="Cari Kode atau Nama Barang... (Tekan F4)" value="${searchQuery}">
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="shortcut-pill">F4 Search</span>
            <span class="shortcut-pill">F8 Bayar</span>
            <span class="shortcut-pill">F2 Checkout</span>
          </div>
        </div>
        <div id="pos-category-filters" class="pos-category-filters">${catPillsHtml}</div>
        <div id="pos-products-grid" class="pos-products-grid">${productsGridHtml}</div>
      </div>

      <!-- Right Panel -->
      <div class="pos-cart-panel">
        <div class="cart-header">
          <div class="cart-title">🛒 Keranjang Belanja <span class="badge badge-slate">${cart.reduce((a,b)=>a+num(b.qty),0)} item</span></div>
          ${cart.length > 0 ? `<button id="clear-cart-btn" class="btn btn-sm btn-secondary" style="color:var(--crimson-600);">Hapus Semua</button>` : ''}
        </div>

        <div id="cart-items-list" class="cart-items-list">${cartRowsHtml}</div>

        <div class="cart-footer">
          <div class="cart-summary-line">
            <span>Subtotal Keranjang:</span>
            <span id="pos-subtotal" class="font-mono" style="font-weight:700;">Rp ${num(subtotal).toLocaleString('id-ID')}</span>
          </div>

          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:12px;font-weight:600;color:var(--slate-600);">Diskon:</span>
            <div style="display:flex;border:1px solid var(--slate-300);border-radius:var(--radius-md);overflow:hidden;">
              <button class="btn btn-sm ${discountType === 'Nominal' ? 'btn-primary' : 'btn-secondary'}" id="toggle-disc-rp" style="border:none;border-radius:0;">Rp</button>
              <button class="btn btn-sm ${discountType === 'Persen' ? 'btn-primary' : 'btn-secondary'}" id="toggle-disc-pct" style="border:none;border-radius:0;">%</button>
            </div>
            <input type="number" id="disc-val-input" class="form-control"
              style="padding:4px 8px;font-size:13px;font-family:var(--font-mono);width:110px;"
              placeholder="0" value="${discountVal || ''}">
          </div>

          <div class="cart-total-hero">
            <div class="hero-total-label">
              <span>TOTAL BAYAR</span>
              <span id="pos-discount-label">${discountAmount > 0 ? '(Hemat Rp ' + num(discountAmount).toLocaleString('id-ID') + ')' : ''}</span>
            </div>
            <div id="pos-grand-total" class="hero-total-val">Rp ${num(grandTotal).toLocaleString('id-ID')}</div>
          </div>

          <div>
            <div class="pay-input-label" style="margin-bottom:4px;">METODE PEMBAYARAN</div>
            <div class="payment-methods-grid">
              <button class="method-btn ${paymentMethod === 'Tunai'    ? 'active' : ''}" data-method="Tunai">💵 Tunai</button>
              <button class="method-btn ${paymentMethod === 'Transfer' ? 'active' : ''}" data-method="Transfer">🏦 Transfer</button>
              <button class="method-btn ${paymentMethod === 'QRIS'     ? 'active' : ''}" data-method="QRIS">📱 QRIS</button>
              <button class="method-btn ${paymentMethod === 'Kredit'   ? 'active' : ''}" data-method="Kredit">🧾 Kredit</button>
            </div>
          </div>

          <!-- Panel Kredit: nama + no HP pelanggan -->
          <div id="kredit-panel" style="display:${paymentMethod === 'Kredit' ? 'flex' : 'none'}; flex-direction:column; gap:8px; background:var(--amber-50, #fffbeb); border:1px solid var(--amber-200, #fde68a); border-radius:var(--radius-md); padding:12px;">
            <div style="font-size:12px; font-weight:700; color:var(--amber-800, #92400e);">🧾 KREDIT — cicilan bebas (bayar kapan pun, berapa pun)</div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:11px;">Nama Pelanggan <span class="required">*</span></label>
              <input type="text" id="kredit-nama" class="form-control" style="padding:6px 10px; font-size:13px;" placeholder="Nama pelanggan" value="${pelangganNama}">
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:11px;">No. HP <span class="required">*</span></label>
              <input type="text" id="kredit-kontak" class="form-control font-mono" style="padding:6px 10px; font-size:13px;" placeholder="08xx-xxxx-xxxx" value="${pelangganKontak}">
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label" style="font-size:11px;">Metode Uang Muka</label>
              <select id="kredit-dp-metode" class="form-control" style="padding:6px 10px; font-size:13px;">
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          <div class="pay-input-group">
            <div class="pay-input-label">
              <span id="paid-input-title">${paymentMethod === 'Kredit' ? 'UANG MUKA (DP)' : 'UANG DITERIMA (Tekan F8)'}</span>
              ${paymentMethod !== 'Tunai' && paymentMethod !== 'Kredit' ? `<span style="font-weight:normal;color:var(--slate-500);">(Non-Tunai: Bayar Pas)</span>` : ''}
            </div>
            <input type="number" id="paid-amount-input" class="pay-input"
              placeholder="0" value="${paidAmount || ((paymentMethod !== 'Tunai' && paymentMethod !== 'Kredit') ? grandTotal : '')}">
          </div>

          <div class="change-display">
            <span>KEMBALIAN:</span>
            <span id="pos-change" class="change-val">Rp ${num(change).toLocaleString('id-ID')}</span>
          </div>

          <button id="checkout-btn" class="btn btn-primary btn-lg btn-block" ${cart.length === 0 ? 'disabled' : ''}>
            ⚡ PROSES TRANSAKSI & CETAK STRUK (F2)
          </button>
        </div>
      </div>
    </div>`;

  // Attach all events after DOM is ready
  setTimeout(() => {
    // Search input — NO re-render, just update grid
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
      if (!searchQuery) searchInput.focus();
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        updateProductGrid();
      });
    }

    // Category pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.onclick = () => { activeCategory = btn.dataset.cat; updateCategoryPills(); updateProductGrid(); };
    });

    // Product cards
    attachProductCardEvents();

    // Cart steppers / delete
    attachCartEvents();

    // Clear all
    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
      cart = [];
      updateCart();
      updateCheckoutBtn();
    });

    // Discount type toggles
    document.getElementById('toggle-disc-rp')?.addEventListener('click', () => {
      discountType = 'Nominal';
      document.getElementById('toggle-disc-rp').className = 'btn btn-sm btn-primary';
      document.getElementById('toggle-disc-pct').className = 'btn btn-sm btn-secondary';
      updateTotalsDisplay();
    });
    document.getElementById('toggle-disc-pct')?.addEventListener('click', () => {
      discountType = 'Persen';
      document.getElementById('toggle-disc-rp').className = 'btn btn-sm btn-secondary';
      document.getElementById('toggle-disc-pct').className = 'btn btn-sm btn-primary';
      updateTotalsDisplay();
    });

    // Discount value — NO re-render, just update totals
    document.getElementById('disc-val-input')?.addEventListener('input', (e) => {
      discountVal = Number(e.target.value) || 0;
      updateTotalsDisplay();
    });

    // Payment methods
    document.querySelectorAll('.method-btn').forEach(btn => {
      btn.onclick = () => {
        paymentMethod = btn.dataset.method;
        document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Tampilkan panel kredit hanya saat metode Kredit
        const kreditPanel = document.getElementById('kredit-panel');
        if (kreditPanel) {
          kreditPanel.style.display = paymentMethod === 'Kredit' ? 'flex' : 'none';
        }

        // Label input bayar: Kredit = Uang Muka (DP)
        const paidTitle = document.getElementById('paid-input-title');
        if (paidTitle) {
          paidTitle.textContent = paymentMethod === 'Kredit' ? 'UANG MUKA (DP)' : 'UANG DITERIMA (Tekan F8)';
        }

        // Reset DP ke 0 saat pindah ke Kredit
        if (paymentMethod === 'Kredit') {
          paidAmount = 0;
          const paidInput = document.getElementById('paid-amount-input');
          if (paidInput) paidInput.value = '';
        }

        updateTotalsDisplay();
      };
    });

    // Paid amount — NO re-render, just update change display
    document.getElementById('paid-amount-input')?.addEventListener('input', (e) => {
      paidAmount = Number(e.target.value) || 0;
      const { grandTotal, change } = calcTotals();
      const changeEl = document.getElementById('pos-change');
      if (changeEl) changeEl.textContent = `Rp ${num(change).toLocaleString('id-ID')}`;
    });

    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    let isProcessing = false; // cegah double-click / double-submit
    const handleCheckout = async () => {
      if (cart.length === 0 || isProcessing) return;
      const { grandTotal, discountAmount } = calcTotals();

      let finalPaid = paidAmount;
      let kreditData = {};

      if (paymentMethod === 'Tunai') {
        if (paidAmount < grandTotal) {
          showToast(`Jumlah bayar kurang! Total: Rp ${num(grandTotal).toLocaleString('id-ID')}`, 'error');
          return;
        }
      } else if (paymentMethod === 'Kredit') {
        const nama = document.getElementById('kredit-nama')?.value.trim() || '';
        const kontak = document.getElementById('kredit-kontak')?.value.trim() || '';
        const dpMetode = document.getElementById('kredit-dp-metode')?.value || 'Tunai';
        if (!nama || !kontak) {
          showToast('Isi nama dan no. HP pelanggan untuk transaksi kredit.', 'error');
          return;
        }
        if (paidAmount < 0 || paidAmount > grandTotal) {
          showToast('Uang muka harus antara Rp 0 dan total transaksi.', 'error');
          return;
        }
        pelangganNama = nama;
        pelangganKontak = kontak;
        kreditData = { pelangganNama: nama, pelangganKontak: kontak, dpMetodeBayar: dpMetode };
        finalPaid = paidAmount; // DP (boleh 0)
      } else {
        finalPaid = grandTotal; // Non-tunai lain: bayar pas
      }

      try {
        isProcessing = true;
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Memproses...';
        const tx = await store.processPOSTransaction({
          cartItems: cart, discountType, discountValue: discountVal,
          discountAmount, paymentMethod, paidAmount: finalPaid,
          idempotencyKey: generateIdempotencyKey(),
          ...kreditData
        });
        const extra = paymentMethod === 'Kredit'
          ? ` Sisa piutang: Rp ${Number(tx.sisa_piutang || 0).toLocaleString('id-ID')}.`
          : '';
        showToast(`Transaksi ${tx.nomor} Sukses Disimpan!${extra}`, 'success');
        cart = []; discountVal = 0; paidAmount = 0;
        pelangganNama = ''; pelangganKontak = '';
        const kreditPanel = document.getElementById('kredit-panel');
        if (kreditPanel) kreditPanel.style.display = 'none';
        // Force full refresh after checkout (stock changed)
        cachedBarangList = await store.getBarang();
        updateCart();
        updateProductGrid();
        updateCheckoutBtn();
        renderReceiptModal(tx);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        isProcessing = false;
        checkoutBtn.disabled = cart.length === 0;
        checkoutBtn.innerHTML = '⚡ PROSES TRANSAKSI & CETAK STRUK (F2)';
      }
    };

    checkoutBtn?.addEventListener('click', handleCheckout);

    // Keyboard shortcuts — hanya aktif di halaman POS, jangan bocor ke halaman lain
    window.onkeydown = (e) => {
      if (!window.location.hash.startsWith('#/pos')) return;
      if (e.key === 'F4') { e.preventDefault(); document.getElementById('pos-search-input')?.focus(); }
      else if (e.key === 'F8') { e.preventDefault(); document.getElementById('paid-amount-input')?.focus(); }
      else if (e.key === 'F2') { e.preventDefault(); handleCheckout(); }
    };
  }, 0);

  return html;
}
