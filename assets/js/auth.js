/**
 * auth.js — GEMAR-KKP Authentication
 *
 * Alur login (aman, tanpa redirect GAS):
 *   1. User submit form
 *   2. fetch() POST dengan URLSearchParams → tidak ada CORS preflight
 *   3. GAS doPost() terima e.parameter, proses login, return JSON
 *   4. Simpan token ke sessionStorage (atau localStorage kalau "ingat saya")
 *   5. Redirect ke dashboard.html via JS (token TIDAK pernah ada di URL)
 */

const AUTH_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbzpAKhOFdtChnNiFk0lig9fU_fn0xzPf9yBv5jJVtTlznlS8xtKuWLqFEEjceajPBXD/exec',
  tokenKey: 'gemar_token',
  userKey: 'gemar_user',
  rememberKey: 'gemar_remember'
};

// ── UI Helpers ────────────────────────────────────────────────────────────────

function showError_(msg) {
  var form = document.querySelector('.form');
  var el = document.getElementById('login-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'login-error';
    el.className = 'form__error';
    form.insertBefore(el, form.querySelector('.field') || form.firstChild);
  }
  el.textContent = msg;
  el.classList.add('form__error--visible');
  el.style.display = 'block';
}

function clearError_() {
  var el = document.getElementById('login-error');
  if (el) {
    el.classList.remove('form__error--visible');
    el.style.display = 'none';
  }
}

function setLoading_(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="btn__spinner"></span> Memproses...';
  } else {
    btn.disabled = false;
    if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
  }
}

// ── Password Toggle ───────────────────────────────────────────────────────────

function togglePassword() {
  var input = document.getElementById('password');
  var icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function handleLogin() {
  var emailInput = document.getElementById('email');
  var passwordInput = document.getElementById('password');
  var rememberEl = document.querySelector('.checkbox input[type="checkbox"]');
  var btn = document.querySelector('button[type="submit"]');

  var email = emailInput ? emailInput.value.trim() : '';
  var password = passwordInput ? passwordInput.value : '';
  var remember = rememberEl ? rememberEl.checked : false;

  clearError_();

  if (!email || !password) {
    showError_('Email dan password wajib diisi');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError_('Format email tidak valid');
    emailInput && emailInput.focus();
    return;
  }

  setLoading_(btn, true);
  if (typeof PageLoader !== 'undefined') PageLoader.start('Memeriksa akun...');

  try {
    var body = new URLSearchParams({
      action: 'auth.login',
      email: email,
      password: password,
      ip: ''
    });

    var response = await fetch(AUTH_CONFIG.apiUrl, {
      method: 'POST',
      body: body
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    var result = await response.json();

    if (result.success) {
      saveSession_(result.data.token, result.data.user, remember);
      if (typeof PageLoader !== 'undefined') PageLoader.setMessage('Masuk berhasil, mengarahkan...');
      window.location.href = 'dashboard.html';
    } else {
      if (typeof PageLoader !== 'undefined') PageLoader.finish();
      showError_(result.error || 'Login gagal. Periksa email dan password.');
    }

  } catch (err) {
    console.error('[GEMAR-KKP] Login error:', err);
    if (typeof PageLoader !== 'undefined') PageLoader.finish();
    showError_('Gagal terhubung ke server. Periksa koneksi internet dan coba lagi.');
  } finally {
    setLoading_(btn, false);
  }
}

// ── Session Management ────────────────────────────────────────────────────────

function saveSession_(token, user, remember) {
  var storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_CONFIG.tokenKey, token);
  storage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
  if (remember) localStorage.setItem(AUTH_CONFIG.rememberKey, 'true');
}

function getToken() {
  return localStorage.getItem(AUTH_CONFIG.tokenKey) ||
    sessionStorage.getItem(AUTH_CONFIG.tokenKey);
}

function getUser() {
  var raw = localStorage.getItem(AUTH_CONFIG.userKey) ||
    sessionStorage.getItem(AUTH_CONFIG.userKey);
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

function clearSession() {
  [localStorage, sessionStorage].forEach(function (s) {
    s.removeItem(AUTH_CONFIG.tokenKey);
    s.removeItem(AUTH_CONFIG.userKey);
    s.removeItem(AUTH_CONFIG.rememberKey);
  });
}

/**
 * Cek apakah sesi masih valid (token belum expired) secara client-side.
 * Token adalah base64url(payload).hmac — payload berisi field `exp` (Unix timestamp).
 */
function isSessionValid() {
  var token = getToken();
  if (!token) return false;
  try {
    var parts = token.split('.');
    if (parts.length !== 2) return false;
    // base64url → standard base64
    var b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    var padding = (4 - b64.length % 4) % 4;
    b64 += '=='.slice(0, padding);
    var payload = JSON.parse(atob(b64));
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch (e) {
    return false;
  }
}

function handleLogout() {
  var token = getToken();
  // Fire-and-forget: beri tahu backend tapi tidak perlu tunggu
  if (token) {
    fetch(AUTH_CONFIG.apiUrl, {
      method: 'POST',
      body: new URLSearchParams({ action: 'auth.logout', token: token })
    }).catch(function () { });
  }
  clearSession();
  window.location.href = '../index.html';
}

/**
 * Panggil di awal halaman yang memerlukan autentikasi.
 * Redirect ke login jika sesi tidak valid.
 */
function requireAuth() {
  if (!isSessionValid()) {
    clearSession();
    window.location.href = '../index.html';
    return null;
  }
  return getUser();
}

// ── Offline Queue Manager (Background Sync) ───────────────────────────────────

const QUEUE_KEY = 'gemar_offline_queue';

function getQueue_() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveQueue_(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

/**
 * Memasukkan request ke queue dan langsung merespons sukses ke UI (Optimistic).
 * Background worker akan memproses queue.
 */
function enqueueRequest(payload) {
  var q = getQueue_();
  q.push({
    id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: Date.now(),
    payload: payload
  });
  saveQueue_(q);
  processQueue(); // Trigger pemrosesan di background
  return Promise.resolve({ success: true, optimistic: true });
}

var isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || !navigator.onLine) return;

  var q = getQueue_();
  if (q.length === 0) return;

  isProcessingQueue = true;

  // Ambil item pertama
  var item = q[0];

  try {
    var body = new URLSearchParams(item.payload);
    var response = await fetch(AUTH_CONFIG.apiUrl, {
      method: 'POST',
      body: body
    });

    if (response.ok) {
      // Sukses, hapus dari queue
      q = getQueue_(); // Refresh queue (in case it changed)
      q = q.filter(function (x) { return x.id !== item.id; });
      saveQueue_(q);
    }
  } catch (err) {
    console.error('[Background Sync] Gagal mengirim data', err);
    // Biarkan di queue untuk retry nanti
  } finally {
    isProcessingQueue = false;
    // Coba proses sisa queue
    if (getQueue_().length > 0) {
      setTimeout(processQueue, 3000); // Jeda 3 detik
    }
  }
}

// Auto-run saat koneksi kembali online
window.addEventListener('online', processQueue);

// Jalankan sekali saat script dimuat (misal saat buka dashboard)
setTimeout(processQueue, 1000);

// ── ApiCache — sessionStorage cache dengan TTL ────────────────────────────────
// Menghindari re-fetch data yang sama saat navigasi antar halaman.
// TTL default 2 menit — cukup untuk covert navigasi normal, tidak stale lama.
const ApiCache = (() => {
  const TTL = 2 * 60 * 1000;

  function _key(ns) {
    try { const u = getUser(); return 'gc_' + (u ? u.id : 'x') + '_' + ns; }
    catch(e) { return 'gc_x_' + ns; }
  }

  function get(ns) {
    try {
      const raw = sessionStorage.getItem(_key(ns));
      if (!raw) return null;
      const { d, t } = JSON.parse(raw);
      if (Date.now() - t > TTL) { del(ns); return null; }
      return d;
    } catch(e) { return null; }
  }

  function set(ns, data) {
    try { sessionStorage.setItem(_key(ns), JSON.stringify({ d: data, t: Date.now() })); }
    catch(e) {}
  }

  function del(ns) {
    try { sessionStorage.removeItem(_key(ns)); } catch(e) {}
  }

  // Hapus semua cache milik user yang sedang login
  function invalidateAll() {
    try {
      const u = getUser();
      const prefix = 'gc_' + (u ? u.id : 'x') + '_';
      Object.keys(sessionStorage).filter(k => k.startsWith(prefix)).forEach(k => sessionStorage.removeItem(k));
    } catch(e) {}
  }

  return { get, set, del, invalidateAll };
})();
