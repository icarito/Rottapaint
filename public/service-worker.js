// Service worker de Rottapaint.
//
// Estrategia:
//  - Navegación / HTML  -> network-first: siempre intenta la red, así un
//    nuevo deploy se ve enseguida; solo cae al cache si estás offline.
//    (Esto evita el bug de servir HTML viejo tras cada despliegue.)
//  - Assets con hash (/_expo/, /assets/) -> cache-first: el nombre cambia
//    en cada build, así que cachearlos para siempre es seguro y rápido.
//  - Resto de GET -> stale-while-revalidate.
//
// Sube CACHE_VERSION cuando cambies esta lógica para invalidar caches viejos.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `rottapaint-${CACHE_VERSION}`;

// El SW se registra con scope = base path (p. ej. "/Rottapaint/" en Pages,
// "/" en local). Derivamos el prefijo de self.location para no hardcodearlo.
const BASE = new URL('./', self.location).pathname; // "/Rottapaint/" o "/"

self.addEventListener('install', () => {
  // Activa esta versión de inmediato sin esperar a que cierren pestañas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith(`${BASE}_expo/`) ||
    url.pathname.startsWith(`${BASE}assets/`)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Solo manejamos peticiones same-origin.
  if (url.origin !== self.location.origin) return;

  // Navegación (carga de páginas): network-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match(BASE);
        }
      })(),
    );
    return;
  }

  // Assets versionados con hash: cache-first.
  if (isImmutableAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
        }
        return fresh;
      })(),
    );
    return;
  }

  // Resto: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
