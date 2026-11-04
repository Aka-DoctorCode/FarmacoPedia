/**
 * ClickSalud FarmacoPedia Service Worker
 * Proporciona soporte offline para la PWA y cacheo de la aplicación.
 */

const CACHE_NAME = 'farmacopedia-pwa-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './MenuCapsulaOn.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Error pre-cacheando assets iniciales:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar métodos no GET
  if (request.method !== 'GET') return;

  // Ignorar llamadas directas a backend API de Render o endpoints de API (gestionados por IndexedDB o en vivo)
  if (
    url.hostname.includes('onrender.com') ||
    url.pathname.includes('/drugs') ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/pending-drugs') ||
    url.pathname.includes('/admin') ||
    url.pathname.startsWith('/api')
  ) {
    return;
  }

  // Ignorar anuncios de Google AdSense
  if (url.hostname.includes('googlesyndication.com') || url.hostname.includes('googleads')) {
    return;
  }

  // Navegación HTML (SPA Fallback): Si está offline, sirve index.html de la caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('./index.html') || await cache.match('./') || await cache.match('/FarmacoPedia/index.html');
        return cachedIndex || Response.error();
      })
    );
    return;
  }

  // Archivos estáticos de Vite y assets (Cache-first con actualización en segundo plano)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
