const CACHE_NAME = 'megafone-pwa-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.webmanifest',
  '/icon.png',
  '/paulista-supermercados.png',
  '/atacadao-3b.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => (key !== CACHE_NAME) && caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Network-first para páginas HTML
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await caches.match(req);
          return cached || caches.match('/index.html');
        }
      })()
    );
  } else {
    // Cache-first para assets
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const networkResponse = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, networkResponse.clone());
        return networkResponse;
      })()
    );
  }
});