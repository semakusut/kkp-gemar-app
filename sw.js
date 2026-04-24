/**
 * GEMAR-KKP Service Worker
 * Network First with Auto-Update Notification
 */

const CACHE_NAME = 'gemar-kkp-v2.1.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './pages/index.html',
  './pages/dashboard.html',
  './pages/laporan-bulanan.html',
  './pages/approval.html',
  './pages/final-report.html',
  './pages/admin.html',
  './pages/list-laporan.html',
  './pages/preview-laporan.html',
  './pages/profile.html',
  './assets/css/gemar-style.css',
  './assets/css/dashboard.css',
  './assets/css/login-mobile.css',
  './assets/js/auth.js',
  './assets/js/loader.js',
  './assets/img/logo.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name);
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests — let cross-origin (GAS API, fonts, etc.) pass through
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached || new Response('Offline – periksa koneksi internet Anda.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        )
      )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});