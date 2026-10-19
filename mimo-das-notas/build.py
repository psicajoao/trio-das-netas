#!/usr/bin/env python3
"""Gera os ícones (a partir de assets/mimo.png) e o service worker com versão por conteúdo.
Uso:  python3 build.py     (rode depois de editar qualquer arquivo do jogo)"""
import hashlib, os, json
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ROOT, 'icons'), exist_ok=True)

def icon(size, safe, path):
    # fundo céu com colina verde; Mimo centralizado (safe = fração da área usada, p/ ícone "maskable")
    S = size
    img = Image.new('RGB', (S, S), (121, 205, 255))
    d = ImageDraw.Draw(img)
    d.ellipse((-S * .2, S * .72, S * 1.2, S * 1.5), fill=(95, 203, 94))
    m = Image.open(os.path.join(ROOT, 'assets/mimo.png')).convert('RGBA')
    h = int(S * safe); w = int(m.width * h / m.height)
    m = m.resize((w, h), Image.LANCZOS)
    img.paste(m, ((S - w) // 2, (S - h) // 2 + int(S * .02)), m)
    img.save(os.path.join(ROOT, path))

icon(512, .80, 'icons/icon-512.png'); icon(192, .80, 'icons/icon-192.png'); icon(180, .80, 'icons/icon-180.png')
icon(512, .62, 'icons/icon-maskable-512.png')

FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css',
         'js/main.js', 'js/notes.js', 'js/phases.js', 'js/store.js', 'js/sound.js', 'js/staff.js', 'js/clef.js',
         'js/keyboard.js', 'js/mimo.js', 'js/hud.js', 'js/game.js',
         'assets/mimo.png', 'fonts/nunito-latin-800-normal.woff2', 'fonts/nunito-latin-900-normal.woff2',
         'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png']
h = hashlib.sha1()
for f in FILES:
    p = os.path.join(ROOT, 'index.html' if f == './' else f)
    h.update(f.encode()); h.update(open(p, 'rb').read())
ver = 'mimo-' + h.hexdigest()[:10]
sw = f"""// Gerado por build.py — não edite à mão.
const VERSION = '{ver}';
const FILES = {json.dumps(FILES)};

self.addEventListener('install', (e) => {{
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', (e) => {{
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('mimo-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});
self.addEventListener('fetch', (e) => {{
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, {{ ignoreSearch: true }}).then((hit) => hit || fetch(req).catch(() => caches.match('./')))
  );
}});
"""
open(os.path.join(ROOT, 'sw.js'), 'w').write(sw)
print('versão', ver)
