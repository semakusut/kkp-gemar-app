/**
 * GEMAR-KKP Service Worker
 * Network First with Auto-Update Notification
 */

const CACHE_NAME = 'gemar-kkp-v1.0.5'; // Ganti versi ini untuk memicu update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/laporan-bulanan.html',
  '/assets/css/gemar-style.css',
  '/assets/css/dashboard.css',
  '/assets/js/auth.js',
  '/assets/img/logo.svg'
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
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Notify clients about the new version
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach(client => {
          client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
        });
      });
    })
  );
});

// Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Abaikan URL API dari caching
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Update cache dengan response terbaru
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request);
      })
  );
});