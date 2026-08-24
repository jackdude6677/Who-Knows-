// WHO KNOWS? — service worker
// Caches the app shell so it installs cleanly and works offline after the first visit.
const CACHE_NAME = 'who-knows-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell, falling back to network — and network-first for
// everything else (like Google Fonts) so content stays fresh when online but still
// mostly works offline once fonts have loaded once.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached))
    );
  } else {
    event.respondWith(
      fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
