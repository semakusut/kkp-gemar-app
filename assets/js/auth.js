/**
 * auth.js — GEMAR-KKP Authentication
 * Using form submit to bypass CORS
 */

const AUTH_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbybBbrfZHBDD7VjvcdLEQ2Xtdn9wwJTtqHkQ44OVLDfR3zsphcKM-VCW_WXc_Zkrbsn/exec',
  tokenKey: 'gemar_token',
  userKey: 'gemar_user',
  rememberKey: 'gemar_remember'
};

function togglePassword() {
  const input = document.getElementById('password');
  const icon = document.getElementById('eye-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function handleLogin() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert('Email dan password wajib diisi');
    return;
  }

  const form = document.createElement('form');
  form.method = 'GET';
  form.action = AUTH_CONFIG.apiUrl;
  form.target = '_self';

  const fields = [
    { name: 'action', value: 'auth.login' },
    { name: 'email', value: email },
    { name: 'password', value: password },
    { name: 'ip', value: '' }
  ];

  fields.forEach(f => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = f.name;
    input.value = f.value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function handleLogout() {
  clearSession();
  window.location.href = 'index.html';
}

function verifySession() {
  const user = getUser();
  if (!user) {
    clearSession();
    return false;
  }
  return true;
}

function setToken(token, remember) {
  if (remember) {
    localStorage.setItem(AUTH_CONFIG.tokenKey, token);
    localStorage.setItem(AUTH_CONFIG.rememberKey, 'true');
  } else {
    sessionStorage.setItem(AUTH_CONFIG.tokenKey, token);
  }
}

function getToken() {
  return localStorage.getItem(AUTH_CONFIG.tokenKey) || sessionStorage.getItem(AUTH_CONFIG.tokenKey);
}

function setUser(user, remember) {
  const userData = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(AUTH_CONFIG.userKey, userData);
  } else {
    sessionStorage.setItem(AUTH_CONFIG.userKey, userData);
  }
}

function getUser() {
  const userData = localStorage.getItem(AUTH_CONFIG.userKey) || sessionStorage.getItem(AUTH_CONFIG.userKey);
  return userData ? JSON.parse(userData) : null;
}

function clearSession() {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.userKey);
  sessionStorage.removeItem(AUTH_CONFIG.tokenKey);
  sessionStorage.removeItem(AUTH_CONFIG.userKey);
}

function initAuth() {
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      handleLogin();
    }
  });
}