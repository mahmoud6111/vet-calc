const CACHE_NAME = 'vet-idrug-v14';

const urlsToCache = [
  '/',
  '/index.html',
  '/default-medications.js',
  '/chat-service.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.png',
  '/fonts/inter.css',
  '/fonts/Inter-400.ttf',
  '/fonts/Inter-500.ttf',
  '/fonts/Inter-600.ttf',
  '/fonts/Inter-700.ttf',
  '/fonts/Inter-800.ttf',
  '/vendor/react.production.min.js',
  '/vendor/react-dom.production.min.js',
  '/vendor/babel.min.js',
  '/vendor/tailwind.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests (let Firebase/CDN requests through)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network-first for navigations, HTML, JS, and CSS so app updates always show
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(match => match || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for static assets (fonts, images, manifest, vendor)
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
  );
});