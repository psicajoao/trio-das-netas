// Gerado por build.py — não edite à mão.
const VERSION = 'mimo-f3a2f33d01';
const FILES = ["./", "index.html", "manifest.webmanifest", "css/style.css", "js/main.js", "js/notes.js", "js/phases.js", "js/store.js", "js/sound.js", "js/staff.js", "js/clef.js", "js/keyboard.js", "js/mimo.js", "js/hud.js", "js/game.js", "assets/mimo.png", "fonts/nunito-latin-800-normal.woff2", "fonts/nunito-latin-900-normal.woff2", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mimo-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).catch(() => caches.match('./')))
  );
});
