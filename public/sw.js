// Service Worker pour PWA avec mode hors-ligne intelligent
const CACHE_NAME = 'gestion-projet-v2';
const OFFLINE_CACHE_NAME = 'gestion-projet-offline-v1';
const DYNAMIC_CACHE_NAME = 'gestion-projet-dynamic-v1';

// Fichiers essentiels pour le mode hors-ligne
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des fichiers statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Créer le cache pour les notifications
        return caches.open('notifications-cache');
      })
      .then(() => {
        console.log('Service Worker: Installation terminée');
        return self.skipWaiting();
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
            cacheName !== OFFLINE_CACHE_NAME && 
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== 'notifications-cache') {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation terminée');
      return self.clients.claim();
    })
  );
});

// Stratégie de cache intelligente
const getCacheStrategy = (request) => {
  const url = new URL(request.url);
  
  // Pour les fichiers statiques : Cache First
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/icons/')) {
    return 'cache-first';
  }
  
  // Pour les API : Network First avec fallback au cache
  if (url.pathname.startsWith('/api/')) {
    return 'network-first';
  }
  
  // Pour les pages HTML : Network First avec fallback au cache
  if (request.headers.get('accept').includes('text/html')) {
    return 'network-first';
  }
  
  // Pour les autres ressources : Stale While Revalidate
  return 'stale-while-revalidate';
};

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const strategy = getCacheStrategy(event.request);
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;
    case 'network-first':
      event.respondWith(networkFirst(event.request));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    default:
      event.respondWith(networkFirst(event.request));
  }
});

// Cache First : utiliser le cache en priorité
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Cache First failed:', error);
    throw error;
  }
}

// Network First : essayer le réseau en premier, puis le cache
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Pour les requêtes API, retourner une réponse offline
    if (request.url.includes('/api/')) {
      return getOfflineResponse(request);
    }
    
    throw error;
  }
}

// Stale While Revalidate : utiliser le cache puis mettre à jour en arrière-plan
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.error('Stale While Revalidate failed:', error);
    return cached;
  });
  
  return cached || fetchPromise;
}

// Réponses hors-ligne pour les API
function getOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Simuler des réponses pour les endpoints critiques
  if (url.pathname.includes('/projects')) {
    return new Response(JSON.stringify({
      error: 'Hors-ligne',
      message: 'Données locales uniquement',
      offline: true,
      data: getOfflineProjects()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.pathname.includes('/tasks')) {
    return new Response(JSON.stringify({
      error: 'Hors-ligne',
      message: 'Tâches locales uniquement',
      offline: true,
      data: getOfflineTasks()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Réponse par défaut pour les autres API
  return new Response(JSON.stringify({
    error: 'Hors-ligne',
    message: 'Fonctionnalité non disponible hors-ligne',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Données locales simulées (à remplacer par IndexedDB)
function getOfflineProjects() {
  return [
    {
      id: 'offline-1',
      name: 'Projet Hors-Ligne',
      description: 'Projet créé hors-ligne',
      status: 'active',
      tasks: [],
      source: 'local',
      offline: true
    }
  ];
}

function getOfflineTasks() {
  return [
    {
      id: 'offline-task-1',
      title: 'Tâche Hors-Ligne',
      description: 'Tâche créée hors-ligne',
      status: 'todo',
      offline: true
    }
  ];
}

// Gestion des messages
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message reçu', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_OFFLINE_DATA') {
    event.ports[0].postMessage({
      projects: getOfflineProjects(),
      tasks: getOfflineTasks()
    });
  }
  
  if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
    // Synchroniser les données locales quand la connexion revient
    syncOfflineData(event.data.payload);
  }
});

// Synchronisation des données hors-ligne
async function syncOfflineData(data) {
  try {
    // Envoyer les données locales au serveur
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('Synchronisation réussie');
      // Notifier les clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_SUCCESS',
            message: 'Données synchronisées avec succès'
          });
        });
      });
    }
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
  }
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification reçue');

  let notificationData = {
    title: 'Notification',
    body: 'Vous avez une nouvelle notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      
      // Gestion spéciale pour les notifications Firebase
      if (pushData.from === 'firebase' || pushData.notification) {
        notificationData = {
          title: pushData.notification?.title || pushData.title || 'Notification ProjectFlow',
          body: pushData.notification?.body || pushData.body || 'Vous avez une nouvelle notification',
          icon: pushData.notification?.icon || '/icons/notification-bell.png',
          badge: '/icons/badge.png',
          tag: pushData.tag || `firebase-${pushData.messageId || Date.now()}`,
          requireInteraction: pushData.requireInteraction || false,
          data: {
            type: 'firebase-notification',
            messageId: pushData.messageId,
            projectId: pushData.data?.projectId,
            taskId: pushData.data?.taskId,
            link: pushData.data?.link,
            projectName: pushData.data?.projectName,
            ...pushData.data
          },
          actions: [
            {
              action: 'open',
              title: 'Ouvrir',
              icon: '/icons/open.png'
            },
            {
              action: 'dismiss',
              title: 'Ignorer',
              icon: '/icons/dismiss.png'
            }
          ],
          silent: false,
          vibrate: [200, 100, 200]
        };
      } else {
        // Notifications push standards
        notificationData = { ...notificationData, ...pushData };
      }
    } catch (e) {
      console.error('Erreur lors du parsing des données de notification:', e);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    data: notificationData.data,
    actions: notificationData.actions || [],
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Gestion du clic sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification cliquée', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Fermer la notification
  notification.close();

  // Gérer les actions personnalisées
  if (action === 'dismiss') {
    console.log('Notification ignorée');
    return;
  }

  // Gérer les actions spécifiques aux tâches
  if (action === 'view-task') {
    event.waitUntil(
      clients.openWindow(`/projects/${data.projectId}?task=${data.taskId}`)
    );
  } else if (action === 'complete-task') {
    event.waitUntil(
      fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: data.taskId })
      }).then(() => {
        return self.registration.showNotification('Tâche terminée!', {
          body: 'La tâche a été marquée comme terminée.',
          icon: '/icons/complete.png',
          tag: 'task-completed-confirmation',
          requireInteraction: false
        });
      }).catch((error) => {
        console.error('Erreur lors de la complétion de la tâche:', error);
      })
    );
  } else {
    // Action par défaut - ouvrir l'application et naviguer vers le lien approprié
    const targetUrl = data.link || '/';
    
    event.waitUntil(
      clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      }).then((clientList) => {
        // Vérifier si une fenêtre de l'application est déjà ouverte
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus sur la fenêtre existante et naviguer
            return client.focus()
              .then((focusedClient) => {
                if (targetUrl !== '/') {
                  return focusedClient.navigate(targetUrl);
                }
                return focusedClient;
              });
          }
        }
        
        // Si aucune fenêtre n'est ouverte, en ouvrir une nouvelle
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de l\'ouverture de l\'application:', error);
        // Fallback: ouvrir simplement la page d'accueil
        return clients.openWindow('/');
      })
    );
  }
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification fermée', event);
  
  const data = event.notification.data || {};
  
  if (data.type === 'task-reminder') {
    console.log('Rappel de tâche ignoré:', data.taskId);
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Synchronisation en arrière-plan', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(
      syncOfflineData()
    );
  }
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      syncPendingNotifications()
    );
  }
});

// Synchronisation des données hors-ligne
async function syncOfflineData() {
  try {
    // Récupérer les données locales depuis IndexedDB
    const offlineData = await getOfflineDataFromIndexedDB();
    
    // Envoyer les données au serveur
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(offlineData)
    });
    
    if (response.ok) {
      console.log('Synchronisation réussie');
      // Nettoyer les données synchronisées
      await clearSyncedData();
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  }
}

// Synchronisation des notifications en attente
async function syncPendingNotifications() {
  try {
    const response = await fetch('/api/notifications/pending');
    const notifications = await response.json();
    
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, notification.options);
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des notifications:', error);
  }
}

// Fonctions IndexedDB (à implémenter)
async function getOfflineDataFromIndexedDB() {
  // Implémentation future avec IndexedDB
  return {
    projects: [],
    tasks: [],
    settings: {}
  };
}

async function clearSyncedData() {
  // Implémentation future avec IndexedDB
  console.log('Données synchronisées nettoyées');
}

// Gestion des notifications périodiques
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicSync', (event) => {
    console.log('Service Worker: Synchronisation périodique', event.tag);
    
    if (event.tag === 'daily-sync') {
      event.waitUntil(
        syncOfflineData()
      );
    }
    
    if (event.tag === 'daily-task-reminder') {
      event.waitUntil(
        checkDailyTasks()
      );
    }
  });
}

// Vérification des tâches quotidiennes
async function checkDailyTasks() {
  try {
    // Récupérer les notifications déjà envoyées aujourd'hui
    const today = new Date().toDateString();
    const sentNotificationsKey = `sent-notifications-${today}`;
    const sentNotifications = await getSentNotifications(sentNotificationsKey);
    
    const response = await fetch('/api/tasks/due-today');
    const tasks = await response.json();
    
    for (const task of tasks) {
      // Ne pas notifier les tâches non suivies
      if (task.status === 'non-suivi') {
        console.log(`Notification ignorée : tâche non suivie ${task.id}`);
        continue;
      }
      
      // Vérifier si le projet est suivi
      const projectResponse = await fetch(`/api/projects/${task.projectId}`);
      const project = await projectResponse.json();
      
      if (!project.isFollowed) {
        console.log(`Notification ignorée : projet non suivi ${task.projectId}`);
        continue;
      }
      
      // Vérifier si la notification a déjà été envoyée aujourd'hui
      const notificationId = `daily-reminder-${task.id}`;
      if (sentNotifications.has(notificationId)) {
        console.log(`Notification déjà envoyée aujourd'hui : ${task.id}`);
        continue;
      }
      
      // Envoyer la notification
      await self.registration.showNotification('Rappel de tâche', {
        body: `La tâche "${task.title}" est due aujourd'hui!`,
        icon: '/icons/task-reminder.png',
        tag: notificationId,
        data: { taskId: task.id, type: 'daily-reminder' }
      });
      
      // Marquer comme envoyée
      sentNotifications.add(notificationId);
    }
    
    // Sauvegarder les notifications envoyées
    await saveSentNotifications(sentNotificationsKey, sentNotifications);
    
  } catch (error) {
    console.error('Erreur lors de la vérification des tâches quotidiennes:', error);
  }
}

// Fonctions pour gérer le tracking des notifications envoyées
async function getSentNotifications(key) {
  try {
    const result = await caches.open('notifications-cache');
    const response = await result.match(key);
    if (response) {
      const data = await response.json();
      return new Set(data.notifications);
    }
    return new Set();
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return new Set();
  }
}

async function saveSentNotifications(key, notifications) {
  try {
    const result = await caches.open('notifications-cache');
    await result.put(key, new Response(JSON.stringify({
      notifications: Array.from(notifications),
      timestamp: Date.now()
    })));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des notifications:', error);
  }
}

// Background Fetch pour le préchargement intelligent
if ('backgroundFetch' in self.registration) {
  self.addEventListener('backgroundfetchsuccess', (event) => {
    console.log('Background fetch success:', event);
  });
  
  self.addEventListener('backgroundfetchfail', (event) => {
    console.error('Background fetch failed:', event);
  });
}

console.log('Service Worker PWA chargé avec succès - Mode hors-ligne activé');
