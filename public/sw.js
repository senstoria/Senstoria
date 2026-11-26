/**
 * Senstoria — service worker app-shell (Tahap 3, 26 Nov 2026).
 *
 * What this caches:
 *  - the app shell: index.html for navigations (network-first, cached
 *    fallback) and same-origin hashed assets under /assets/ (cache-first;
 *    Vite hashes their filenames, so a cached copy can never be stale).
 *
 * What this NEVER touches:
 *  - cross-origin requests (Firebase/Firestore/Auth, Google Fonts, …) —
 *    they pass straight through to the network, so the worker can never
 *    serve stale account or catalog data as if it were fresh;
 *  - non-GET requests (writes must always reach the server);
 *  - the SPA rewrites in vercel.json are untouched: a navigation to
 *    /catalog/<slug>, /katalog/<slug>, /legal/* or /auth/* is served
 *    index.html by the server when online, and the cached shell when
 *    offline — the client router then renders the right view.
 *
 * Offline behaviour is honest by design: the shell opens, and the app's
 * own data-load error handling (never faked data, retry offered) tells
 * the user the catalog/library needs a connection. No white screen.
 */

const CACHE_NAME = 'senstoria-shell-v1';
const SHELL_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(SHELL_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only same-origin GET requests are candidates. Everything else
  // (Firebase, fonts, writes, Range requests) goes to the network
  // untouched — the worker must never stand between the app and data.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('range')) return;

  // Navigations (including deep links /catalog/<slug>, /katalog/<slug>,
  // /legal/*, /auth/*): network-first so the user always gets the newest
  // shell; fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_URL)),
    );
    return;
  }

  // Hashed build assets under /assets/ (JS/CSS/images from Vite):
  // cache-first — their filenames change on every build, so a cached
  // entry is either the current file or never requested again.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
  // All other same-origin GETs (manifest, robots.txt, …): network only.
});
