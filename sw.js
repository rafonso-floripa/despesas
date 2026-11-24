// Permite abrir o app sem internet (busca na rede primeiro; sem rede, usa a cópia guardada).
const CACHE = 'despesas-v10';
const ARQUIVOS = ['./', 'index.html', 'styles.css', 'app.js', 'db.js', 'drive.js', 'agidesk.js', 'config.js', 'valores.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }) // sempre confere se há versão nova
      .then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
