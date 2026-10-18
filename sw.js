// Trio das Netas: tudo que o jogo usa fica guardado no aparelho.
// A versão muda sozinha quando qualquer arquivo muda; assim o iPad troca o cache antigo pelo novo.
var V = 'trio-38e89b7ff0';
var FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "fonts/fredoka-500.woff2", "fonts/fredoka-600.woff2", "fonts/fredoka-700.woff2", "fonts/nunito-700.woff2", "fonts/nunito-800.woff2"];

self.addEventListener('install', function (e) {
  // addAll é tudo-ou-nada: se faltar um arquivo, esta versão não é instalada.
  e.waitUntil(
    caches.open(V)
      .then(function (c) { return c.addAll(FILES.map(function (u) { return new Request(u, { cache: 'reload' }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // o jogo não usa nada de fora
  e.respondWith(
    caches.open(V).then(function (c) {
      var key = req.mode === 'navigate' ? 'index.html' : req;
      return c.match(key, { ignoreSearch: true }).then(function (hit) {
        return hit || fetch(req).catch(function () { return c.match('index.html'); });
      });
    })
  );
});

// a página pergunta se tudo já está guardado
self.addEventListener('message', function (e) {
  if (e.data !== 'status' || !e.ports || !e.ports[0]) return;
  var port = e.ports[0];
  caches.open(V).then(function (c) {
    return Promise.all(FILES.map(function (u) { return c.match(u).then(function (r) { return r ? null : u; }); }));
  }).then(function (miss) {
    miss = miss.filter(Boolean);
    port.postMessage({ ready: miss.length === 0, version: V, missing: miss });
  });
});
