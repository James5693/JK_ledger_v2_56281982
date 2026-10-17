/* Keeps the ledger working with nothing to connect to.

   Everything is saved on the first visit. After that the ledger opens from that saved copy straight
   away, whether or not there is any internet, and quietly looks for a newer one for next time. Your
   characters and your books are not in here — they are in the device's own database, which this
   never touches. */
const CACHE = 'ledger-dc9a50bca9';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-120.png', 'icon-152.png', 'icon-167.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'font-licences.txt'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r && r.ok && !r.redirected) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }          // saved copy first: instant, and works with no internet
    const r = await net;
    return r || (await c.match('index.html')) || Response.error();
  }));
});
