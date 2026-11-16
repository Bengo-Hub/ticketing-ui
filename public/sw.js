/* eslint-disable no-restricted-globals */
//
// Hand-written service worker for the Ticketing PWA. This is the fleet pattern from maskani-ui and
// pos-ui: a committed static worker, registered by the shared OfflineBar in production, that no
// build step writes. It works the same under Turbopack and webpack.
//
//   - Page navigations: network first, raced against a short timeout, falling back to the last
//     cached copy of that page (or any cached page) so the app shell opens on weak data or
//     offline after one online visit.
//   - /_next/static, icons and other static files: cache first. Their names are content hashed.
//   - API calls: never handled here. ticketing-api, auth-api and every other cross-origin request
//     go straight to the network, and same-origin /api and /healthz are skipped too, so no
//     authenticated response is ever stored by this worker.
//
// New deploys are offered by the shared PwaUpdater, which compares the served build with the one
// the tab loaded. Bump VERSION only when this file's caching rules change.

const VERSION = 'ticketing-sw-v1';
const DOC_CACHE = `${VERSION}-documents`;
const ASSET_CACHE = `${VERSION}-assets`;
const NAV_TIMEOUT_MS = 3500;
const MAX_DOCS = 30;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/manifest.json' ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)
  );
}

// Keeps the document cache bounded: the oldest entries go first.
async function trimDocs(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_DOCS; i += 1) await cache.delete(keys[i]);
}

async function handleNavigation(request) {
  const cache = await caches.open(DOC_CACHE);
  const cachedDoc = async () => {
    const exact = await cache.match(request, { ignoreSearch: true });
    if (exact) return exact;
    const any = (await cache.keys())[0];
    return any ? cache.match(any) : undefined;
  };
  const networkFetch = (async () => {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      await cache.put(request, fresh.clone());
      await trimDocs(cache);
    }
    return fresh;
  })();
  try {
    const hasCached = (await cache.keys()).length > 0;
    if (!hasCached) return await networkFetch;
    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), NAV_TIMEOUT_MS));
    const winner = await Promise.race([networkFetch.catch(() => 'error'), timeout]);
    if (winner !== 'timeout' && winner !== 'error') return winner;
    networkFetch.catch(() => {});
    const doc = await cachedDoc();
    if (doc) return doc;
    return await networkFetch;
  } catch {
    const doc = await cachedDoc();
    if (doc) return doc;
    return new Response(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui;padding:2rem;color:#1e1b4b"><p>You are offline. Ticketing will open again when the connection returns.</p><p lang="sw">Huna mtandao kwa sasa. Tiketi zitafunguka tena mtandao ukirudi.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 },
    );
  }
}

async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200 && fresh.type === 'basic') cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // API servers live on their own origins; anything cross-origin is left to the network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/healthz') return;
  // A request carrying credentials in a header is an API call, never cached.
  if (request.headers.has('Authorization')) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  if (isAsset(url)) event.respondWith(handleAsset(request));
});
