// Offline: guarda os arquivos do app para abrir sem internet. As notas ficam na cópia do aparelho
// (sync.js); o GitHub nunca passa por aqui.
const VERSAO = 'cerebro-v3';
const APP = ['./', 'index.html', 'cosmos.css', 'config.js', 'nucleo.js', 'temas.js', 'som.js', 'universo.js', 'sync.js', 'conectar.js', 'cosmos.js', 'inicio.js',
  'manifest.webmanifest', 'icones/icone.svg', 'icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-180.png'];
const DE_FORA = ['https://cdn.jsdelivr.net/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname === 'api.github.com') return;              // sempre direto no GitHub
  if (url.pathname.endsWith('/dados-cerebro.js')) return;     // cópia do PC, só em desenvolvimento

  // Bibliotecas e fontes: usa a guardada e só busca se não tiver.
  if (DE_FORA.some(p => request.url.startsWith(p))) {
    e.respondWith(caches.match(request).then(r => r || fetch(request).then(resp => {
      const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(request, copia)); return resp;
    })));
    return;
  }
  // Arquivos do app: tenta a versão nova primeiro (atualiza sozinho) e cai na guardada sem internet.
  if (url.origin === location.origin) {
    e.respondWith(fetch(request).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(request, copia)); }
      return resp;
    }).catch(() => caches.match(request).then(r => r || caches.match('index.html'))));
  }
});
