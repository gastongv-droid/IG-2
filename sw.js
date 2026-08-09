const CACHE_NAME = 'foto-historia-v2';
const SHARE_CACHE = 'foto-historia-shared';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './share-target.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Interceptamos el POST que manda Android cuando el usuario comparte una foto
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target.html')) {
    event.respondWith(handleShare(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

async function handleShare(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo');

    if (file) {
      const cache = await caches.open(SHARE_CACHE);
      // Guardamos el archivo compartido bajo una key fija para que index.html lo recupere
      const response = new Response(file, {
        headers: { 'Content-Type': file.type || 'image/jpeg' }
      });
      await cache.put('/shared-photo', response);
    }

    return Response.redirect('./share-target.html?shared=1', 303);
  } catch (e) {
    return Response.redirect('./share-target.html?shared=0', 303);
  }
}
