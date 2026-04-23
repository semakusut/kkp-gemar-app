/**
 * GEMAR-KKP Service Worker
 * PWA Auto Update & Offline Caching
 */

const CACHE_NAME = 'gemar-kkp-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/gemar-style.css',
  '/assets/css/login-mobile.css',
  '/assets/js/auth.js',
  '/assets/img/logo.svg',
  '/assets/img/logo-h.svg'
];

const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => {
      if (event.request.destination === 'image') {
        return new Response('', { status: 0, statusText: '' });
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('updatefound', () => {
  const newSw = registration.installing;
  newSw.addEventListener('statechange', () => {
    if (newSw.state === 'installed' && navigator.serviceWorker.controller) {
      console.log('[SW] New version available');
      
      if (navigator.serviceWorker.controller) {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'NEW_VERSION_AVAILABLE',
              version: CACHE_NAME
            });
          });
        });
      }
    }
  });
});

function checkForUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('[SW] Service worker registered:', registration.scope);
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
    }).catch((err) => {
      console.error('[SW] Registration failed:', err);
    });
  }
}

function showUpdateNotification() {
  if (confirm('GEMAR-KKP telah diperbarui. Muat ulang untuk menggunakan versi terbaru?')) {
    window.location.reload();
  }
}