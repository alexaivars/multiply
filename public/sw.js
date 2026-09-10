// Bump this version whenever public assets change. Updates activate after all
// existing app windows close, keeping an in-progress round on one app version.
const CACHE = 'multiply-static-v21-feedback-hierarchy';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './core.js', './statistics.js', './answer-formats.js',
  './pwa.js', './favicon.svg', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
const assetURLs = ASSETS.map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(assetURLs.map(url => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('multiply-static-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  url.search = '';
  // Only explicitly listed public app assets belong in this cache.
  if (event.request.method !== 'GET' || !assetURLs.includes(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(url.href) || fetch(event.request);
  })());
});
