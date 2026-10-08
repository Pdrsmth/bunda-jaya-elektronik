// Login View

import { store } from '../store.js';
import { showToast } from '../components/toast.js';

export function renderLogin() {
  return `
    <div class="login-wrapper">
      <div class="login-card">
        <span class="login-icon">⚡</span>
        <h2>Bunda Jaya Elektronik</h2>
        <h3>Sistem POS & Inventaris</h3>
        
        <form id="login-form" class="login-form">
          <div class="input-group">
            <input 
              type="text" 
              id="login-username" 
              required
              autocomplete="username"
              placeholder="Username"
            />
          </div>
          
          <div class="input-group">
            <input 
              type="password" 
              id="login-password" 
              required
              autocomplete="current-password"
              placeholder="Password"
            />
          </div>
          
          <button type="submit" id="login-btn">LOGIN</button>
        </form>
      </div>
    </div>
  `;
}

export function attachLoginEvents() {
  const form = document.getElementById('login-form');
  const btn  = document.getElementById('login-btn');

  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showToast('Username dan password harus diisi.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Memproses...';
    btn.style.background = '#64748b';

    try {
      const user = await store.login(username, password);

      // Redirect setelah login
      const redirect = '#/dashboard';
      showToast(`Selamat datang, ${user.name || user.nama}!`, 'success');
      window.location.hash = redirect;

    } catch (error) {
      showToast(error.message || 'Login gagal. Periksa username dan password.', 'error');
      btn.disabled = false;
      btn.textContent = 'LOGIN';
      btn.style.background = '';
    }
  };
}
