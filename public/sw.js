const CACHE_NAME = 'quran-tracker-v2';
const ASSETS = [
  '/Quran-tracker/',
  '/Quran-tracker/index.html',
  '/Quran-tracker/manifest.json',
  '/Quran-tracker/icon-192.png',
  '/Quran-tracker/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Quran API calls (audio) - don't cache
  if (event.request.url.includes('api.quran.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Quran Tracker';
  const options = {
    body: data.body || 'Time for your daily Quran review!',
    icon: '/Quran-tracker/icon-192.png',
    badge: '/Quran-tracker/icon-192.png',
    tag: 'quran-reminder',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/Quran-tracker/')
  );
});
