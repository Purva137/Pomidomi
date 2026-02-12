'use strict';

const CACHE_NAME = 'pixel-pomodoro-v1';

const ASSETS_TO_CACHE = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'focus.png',
  'break.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var base = self.location.origin + self.location.pathname.replace(/\/[^/]+$/, '/');
      return cache.addAll(ASSETS_TO_CACHE.map(function (path) {
        return base + path;
      })).catch(function (err) {
        console.warn('Cache addAll failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(function (response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var requestUrl = new URL(event.request.url);
        if (requestUrl.origin === self.location.origin) {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(function () {
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return caches.match(event.request);
      });
    })
  );
});
