const C = 'spendcue-v18';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Network first, cache only as the offline fallback. Serving the cache first
// meant every visit showed the previous version and only fetched the new one
// for next time, so a change was always one reload behind.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Only this app's own files. Anything else — the Google sign-in script, the
  // Drive API — must never be stored: those responses carry the user's data,
  // and nothing here would clear them on disconnect.
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
