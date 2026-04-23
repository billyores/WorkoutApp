// WorkTrack Service Worker — Cache-First strategy for offline support
const CACHE_NAME = 'worktrack-v1';

const CACHE_FILES = [
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/storage.js',
  './js/app.js',
  './js/data/exercises.js',
  './js/data/workout-plans.js',
  './js/components/drag-drop.js',
  './js/components/muscle-status.js',
  './js/components/workout-logger.js',
  './js/components/calendar.js',
  './js/components/plan-builder.js',
  './js/components/history.js',
  './js/components/goals.js',
  './js/components/stats.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve from cache; update cache in background
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(event.request, response)
              );
            }
          })
          .catch(() => {});
        return cached;
      }
      // Not cached — fetch from network and cache it
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
