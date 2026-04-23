/**
 * GEMAR-KKP Service Worker
 * Simple offline caching only
 */

const CACHE_NAME = 'gemar-kkp-v1.0.2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => {
        if (name !== CACHE_NAME) return caches.delete(name);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't intercept - let browser handle all requests directly
});