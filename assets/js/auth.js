/**
 * auth.js — GEMAR-KKP Authentication
 * Handles login, logout, session management
 */

const AUTH_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  tokenKey: 'gemar_token',
  userKey: 'gemar_user',
  rememberKey: 'gemar_remember'
};

function getClientIp() {
  return fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => data.ip)
    .catch(() => 'unknown');
}

function handleLogin() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.querySelector('.checkbox input');
  const submitBtn = document.querySelector('.btn');
  const errorContainer = createErrorContainer();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const remember = rememberCheckbox ? rememberCheckbox.checked : false;

  errorContainer.remove();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn__spinner"></span> Memasuki...';

  if (!validateEmail(email)) {
    showError(errorContainer, 'Format email tidak valid', emailInput);
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Masuk ke GEMAR-KKP<svg class="btn__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    return;
  }

  if (!validatePassword(password)) {
    showError(errorContainer, 'Password minimal 8 karakter', passwordInput);
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Masuk ke GEMAR-KKP<svg class="btn__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    return;
  }

  getClientIp().then(clientIp => {
    const payload = {
      email: email,
      password: password,
      ip: clientIp
    };

    fetch(AUTH_CONFIG.apiUrl + '?action=auth.login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Masuk ke GEMAR-KKP<svg class="btn__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

      if (data.success) {
        setToken(data.data.token, remember);
        setUser(data.data.user, remember);

        if (data.data.user.role === 'superadmin') {
          window.location.href = 'admin.html';
        } else if (data.data.user.role === 'eselon1') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } else {
        showError(errorContainer, data.error, emailInput);

        if (data.code === 429) {
          emailInput.disabled = true;
          passwordInput.disabled = true;
          submitBtn.disabled = true;
          const waitMatch = data.error.match(/(\d+)\s*menit/);
          if (waitMatch) {
            setTimeout(() => {
              emailInput.disabled = false;
              passwordInput.disabled = false;
              submitBtn.disabled = false;
            }, parseInt(waitMatch[1]) * 60 * 1000);
          }
        }
      }
    })
    .catch(err => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Masuk ke GEMAR-KKP<svg class="btn__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      showError(errorContainer, 'Tidak dapat terhubung ke server. Periksa koneksi internet.', emailInput);
      console.error('Login error:', err);
    });
  });
}

function handleLogout() {
  const token = getToken();

  if (token) {
    fetch(AUTH_CONFIG.apiUrl + '?action=auth.logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token })
    }).catch(() => {});
  }

  clearSession();
  window.location.href = 'index.html';
}

function verifySession() {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    clearSession();
    return false;
  }

  fetch(AUTH_CONFIG.apiUrl + '?action=auth.verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: token })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      clearSession();
      window.location.href = 'index.html';
    }
  })
  .catch(() => {
    clearSession();
    window.location.href = 'index.html';
  });

  return true;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function createErrorContainer() {
  const form = document.querySelector('.form');
  let errorContainer = document.getElementById('error-message');

  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'error-message';
    errorContainer.className = 'form__error';
    form.insertBefore(errorContainer, form.firstChild);
  }

  return errorContainer;
}

function showError(container, message, inputElement) {
  container.textContent = message;
  container.classList.add('form__error--visible');

  if (inputElement) {
    inputElement.classList.add('field__input--error');

    inputElement.addEventListener('input', function handler() {
      inputElement.classList.remove('field__input--error');
      container.classList.remove('form__error--visible');
      inputElement.removeEventListener('input', handler);
    });
  }

  setTimeout(() => {
    container.classList.remove('form__error--visible');
  }, 5000);
}

function setToken(token, remember) {
  if (remember) {
    localStorage.setItem(AUTH_CONFIG.tokenKey, token);
    localStorage.setItem(AUTH_CONFIG.rememberKey, 'true');
  } else {
    sessionStorage.setItem(AUTH_CONFIG.tokenKey, token);
    localStorage.removeItem(AUTH_CONFIG.rememberKey);
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
  localStorage.removeItem(AUTH_CONFIG.rememberKey);
  sessionStorage.removeItem(AUTH_CONFIG.tokenKey);
  sessionStorage.removeItem(AUTH_CONFIG.userKey);
}

function initAuth() {
  const remember = localStorage.getItem(AUTH_CONFIG.rememberKey);
  if (remember === 'true') {
    const user = getUser();
    if (user) {
      verifySession();
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      handleLogin();
    }
  });
}