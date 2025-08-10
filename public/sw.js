
// sw.js — offline cache + push → auto-refresh
const VERSION = 'v1.0.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// Network-first for API, cache-first for app shell
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
  if (url.pathname.startsWith('/api/')) {
    evt.respondWith((async () => {
      try {
        const fresh = await fetch(evt.request);
        return fresh;
      } catch (e) {
        const cache = await caches.open(VERSION);
        const cached = await cache.match(evt.request);
        return cached || new Response(JSON.stringify({ items: [] }), { headers: { 'Content-Type': 'application/json' } });
      }
    })());
  } else if (APP_SHELL.includes(url.pathname) || url.origin === location.origin) {
    evt.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(evt.request);
      return cached || fetch(evt.request);
    })());
  }
});

// Push → show notification and nudge clients to refresh
self.addEventListener('push', (evt) => {
  let data = {};
  try { data = evt.data ? evt.data.json() : {}; } catch {}
  const title = data.title || 'Prophecy Watch';
  const body = data.body || 'New update available';
  const url = data.url || '/';

  // Tell clients there is fresh content
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    for (const client of clients) client.postMessage({ type: 'refresh' });
  });

  evt.waitUntil(self.registration.showNotification(title, {
    body,
    data: { url },
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  }));
});

self.addEventListener('notificationclick', (evt) => {
  evt.notification.close();
  const url = (evt.notification.data && evt.notification.data.url) || '/';
  evt.waitUntil((async () => {
    const clientsArr = await clients.matchAll({ type: 'window' });
    for (const c of clientsArr) {
      if (c.url.includes(self.location.origin)) { c.focus(); return; }
    }
    clients.openWindow(url);
  })());
});
