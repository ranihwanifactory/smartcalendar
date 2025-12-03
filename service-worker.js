const CACHE_NAME = 'smart-calendar-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Become available to all pages
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL FIX: Do not intercept cross-origin requests (like React CDN, Firebase CDN).
  // Let the browser handle these via standard HTTP networking.
  // Intercepting them without a proper strategy causes "Network Error" when installed.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Navigation requests (HTML): Try Network first, fall back to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Local Assets (JS, CSS, Images in the same origin): Cache First, then Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});