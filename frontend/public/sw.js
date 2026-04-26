const CACHE_NAME = 'hireflow-v1';
const ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add each asset individually and catch errors so one missing asset doesn't fail the whole cache
      return Promise.allSettled(
        ASSETS.map(asset => cache.add(asset).catch(err => console.warn('SW failed to cache:', asset, err)))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
