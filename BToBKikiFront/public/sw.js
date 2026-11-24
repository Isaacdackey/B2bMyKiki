// Service Worker pour l'application Mykiki - Kiki Traiteur
const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `mykiki-cache-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/assets/images/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pré-mise en cache partielle :', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Auto-destruction : purge tous les caches et se désinscrit.
  // Indispensable lorsqu'une version installée sert un bundle périmé —
  // l'application ne peut alors plus se corriger d'elle-même, puisque le
  // correctif se trouve dans le fichier que le cache remplace.
  if (event.data && event.data.type === 'PURGE_ALL') {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then((clients) => clients.forEach((c) => c.navigate(c.url)))
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Check if we are in local development (localhost or local IP)
  const isLocalDev = url.includes('localhost') || url.includes('127.0.0.1') || 
                     url.match(/^https?:\/\/(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./);

  // If local development, BYPASS cache completely to see changes instantly
  if (isLocalDev) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ignorer les requêtes API dynamiques, websockets et externes
  if (
    url.includes('/api/') ||
    url.includes('onrender.com') ||
    url.includes('googleapis.com') ||
    url.includes('google.com') ||
    url.includes('cloudinary.com') ||
    url.includes('sockjs-node') ||
    url.includes('ng-cli-ws')
  ) {
    return;
  }

  // version.json : direct réseau pour détection immédiate
  if (url.includes('version.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 1. Navigation / Document HTML : NETWORK-FIRST avec secours garanti sur /index.html
  if (event.request.mode === 'navigate' || url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          }
          return fetch('/index.html')
            .then((idxRes) => {
              if (idxRes && idxRes.status === 200) return idxRes;
              return caches.match('/index.html').then((cached) => cached || response);
            })
            .catch(() => caches.match('/index.html').then((cached) => cached || response));
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // 2. Chunks JS / CSS / Assets : Network-First sur prod
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
        });
      })
  );
});
