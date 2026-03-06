// Service Worker pour PWA - ProjectFlow
// Version: 3.0 - Compatible GitHub Pages /gestion-projet/

const CACHE_VERSION = 'v3';
const CACHE_NAME = `projectflow-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `projectflow-dynamic-${CACHE_VERSION}`;
const NOTIFICATIONS_CACHE = 'projectflow-notifications';

// Fichiers essentiels à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

// ============================================================
// INSTALLATION
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // addAll avec gestion d'erreurs pour ne pas bloquer si un fichier manque
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn(`SW: Impossible de mettre en cache ${url}:`, err.message);
          }))
        );
      })
      .then(() => {
        console.log('✅ SW: Installation terminée');
        return self.skipWaiting();
      })
  );
});

// ============================================================
// ACTIVATION - Nettoyage des anciens caches
// ============================================================
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, DYNAMIC_CACHE_NAME, NOTIFICATIONS_CACHE];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => !currentCaches.includes(name))
            .map(name => {
              console.log('🗑️ SW: Suppression de l\'ancien cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ SW: Activation terminée');
        return self.clients.claim();
      })
  );
});

// ============================================================
// STRATÉGIE DE CACHE
// ============================================================
const getCacheStrategy = (request) => {
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';

  // Exclure les extensions Chrome, Firefox et autres protocoles non-http
  if (!url.protocol.startsWith('http')) {
    return 'passthrough';
  }

  // Fichiers statiques (assets buildés avec hash) → Cache First
  if (url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)(\?.*)?$/) &&
      url.pathname.includes('/assets/')) {
    return 'cache-first';
  }

  // Images et icônes → Cache First
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/)) {
    return 'cache-first';
  }

  // API Firebase et services externes → Network Only
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('cloudinary') ||
      url.hostname.includes('emailjs')) {
    return 'network-only';
  }

  // Pages HTML → Network First avec fallback vers index.html
  if (accept.includes('text/html')) {
    return 'network-first-html';
  }

  // Tout le reste → Stale While Revalidate
  return 'stale-while-revalidate';
};

// ============================================================
// INTERCEPTION DES REQUÊTES
// ============================================================
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  const strategy = getCacheStrategy(event.request);

  switch (strategy) {
    case 'passthrough':
    case 'network-only':
      // Laisser passer sans interférer
      return;

    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;

    case 'network-first-html':
      event.respondWith(networkFirstHTML(event.request));
      break;

    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;

    default:
      event.respondWith(networkFirst(event.request));
  }
});

// Cache First : utiliser le cache en priorité (assets statiques)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('SW Cache First failed:', request.url, error.message);
    throw error;
  }
}

// Network First pour HTML : avec fallback vers index.html (SPA)
async function networkFirstHTML(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Fallback : retourner la page en cache ou index.html
    const cached = await caches.match(request);
    if (cached) return cached;

    const indexPage = await caches.match('./index.html') ||
                      await caches.match('./') ;
    if (indexPage) return indexPage;

    throw new Error('Aucune page disponible hors-ligne');
  }
}

// Network First standard
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error(`Réseau indisponible: ${request.url}`);
  }
}

// Stale While Revalidate : cache immédiat + mise à jour en arrière-plan
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ============================================================
// MESSAGES DU CLIENT
// ============================================================
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================================
// NOTIFICATIONS PUSH
// ============================================================
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'ProjectFlow',
    body: 'Vous avez une nouvelle notification',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    tag: 'default',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();

      if (pushData.notification) {
        notificationData = {
          ...notificationData,
          title: pushData.notification.title || notificationData.title,
          body: pushData.notification.body || notificationData.body,
          icon: pushData.notification.icon || notificationData.icon,
          tag: pushData.tag || `push-${Date.now()}`,
          data: pushData.data || {},
        };
      } else {
        notificationData = { ...notificationData, ...pushData };
      }
    } catch (e) {
      console.error('SW: Erreur parsing notification push:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
    })
  );
});

// ============================================================
// CLIC SUR NOTIFICATION
// ============================================================
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const data = notification.data || {};

  notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = data.link || self.location.origin + '/gestion-projet/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then((c) => {
              if (targetUrl !== '/') c.navigate(targetUrl);
              return c;
            });
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
      .catch(() => clients.openWindow(self.location.origin + '/gestion-projet/'))
  );
});

// ============================================================
// SYNCHRONISATION ARRIÈRE-PLAN
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(
      // Notifier les clients que la connexion est revenue
      self.clients.matchAll().then(clientList => {
        clientList.forEach(client => {
          client.postMessage({ type: 'ONLINE_SYNC_READY' });
        });
      })
    );
  }
});

console.log('✅ Service Worker ProjectFlow v3 chargé');
