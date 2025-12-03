const CACHE_NAME = 'smart-calendar-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 1. Cross-Origin Requests (CDNs, Firebase):
  // Let the browser handle these directly. Do not involve the Service Worker.
  // This prevents CORS errors from breaking the app.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 2. Navigation Requests (HTML pages):
  // Network First, then Fallback to Cache.
  // This ensures the user gets the latest version if online, but the app still opens if offline/failed.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          return await fetch(event.request);
        } catch (error) {
          // If network fails, try to serve the cached index.html
          const cache = await caches.open(CACHE_NAME);
          // Check for './index.html' first, then try './' (root)
          let cachedResponse = await cache.match('./index.html');
          if (!cachedResponse) {
            cachedResponse = await cache.match('./');
          }
          return cachedResponse;
        }
      })()
    );
    return;
  }

  // 3. Asset Requests (Local JS, CSS, Images):
  // Cache First, then Network.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});