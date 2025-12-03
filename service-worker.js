const CACHE_NAME = 'smart-calendar-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Use {cache: 'reload'} to ensure we get fresh files from server during install
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch((err) => {
        console.error('Failed to cache files during install:', err);
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
  // 1. Cross-Origin Requests: Let browser handle them.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 2. Navigation Requests (HTML pages):
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Network First
          return await fetch(event.request);
        } catch (error) {
          // Fallback to cache
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('/index.html');
          if (cachedResponse) {
             return cachedResponse;
          }
          // If index.html is missing in cache, try root
          return await cache.match('/') || Response.error();
        }
      })()
    );
    return;
  }

  // 3. Asset Requests: Cache First, then Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});