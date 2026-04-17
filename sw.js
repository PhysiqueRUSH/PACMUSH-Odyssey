// sw.js - Service Worker pour PACMUSH ODYSSEY
const CACHE_NAME = 'pacmush-odyssey-v2.4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/sol_foret.png',
  '/chene.png',
  '/pin.png',
  '/champignon_1.png',
  '/champignon_2.png',
  '/champignon_3.png',
  '/champignon_4.png',
  '/champignon_5_bordered.png',
  '/champignon_6_bordered.png',
  '/champignon_7.png',
  '/champignon_8.png',
  '/Parasite_1.png',
  '/Parasite_2.png',
  '/Parasite_3.png',
  '/Parasite_4.png',
  '/Parasite_5.png',
  '/Parasite_6.png',
  '/Parasite_7.png',
  '/mushroom_hill_zone.mp3'
];

// Installation : mise en cache de tous les assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache des assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie : Cache First, puis réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les requêtes vers d'autres domaines
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ignorer les requêtes vers l'API ou les sockets (si tu en as)
  if (event.request.url.includes('/api/') || event.request.url.includes('sockjs')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Retourne la ressource du cache
          return cachedResponse;
        }

        // Sinon, va la chercher sur le réseau
        return fetch(event.request)
          .then(response => {
            // Vérifie si la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Met en cache la nouvelle ressource (clone car le stream ne peut être utilisé qu'une fois)
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Erreur fetch:', error);
            // Tu pourrais retourner une page offline ici si besoin
          });
      })
  );
});

// Gestion des messages (optionnel, pour debug ou mise à jour)
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
