import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Pre-cache tous les assets générés par le build
const manifest = self.__WB_MANIFEST;
if (manifest) {
  precacheAndRoute(manifest);
}
cleanupOutdatedCaches();

// Désactiver l'interception du Service Worker pour les scripts internes de Vite/Astro (IMPORTANT pour npm run dev)
registerRoute(
  ({ url }) => 
    url.pathname.startsWith('/@') || 
    url.pathname.startsWith('/node_modules/') ||
    url.hostname === 'vite' ||
    url.hostname === 'fs' ||
    url.pathname.includes('vite') ||
    url.pathname === '/sw.js',
  new NetworkOnly()
);

// Logique Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-auth-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAiEu-xlbONd1jKwlRKCMhHrgLWvCNPnsc",
  authDomain: "gestion-projet-b8c77.firebaseapp.com",
  projectId: "gestion-projet-b8c77",
  storageBucket: "gestion-projet-b8c77.firebasestorage.app",
  messagingSenderId: "650111904365",
  appId: "1:650111904365:web:478c0f1c9c8445e357ad64"
};

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();
const db = firebase.firestore();
const auth = firebase.auth();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Message en arrière-plan reçu ', payload);

  if (!payload || (!payload.notification && !payload.data)) {
    return;
  }

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Nouvelle notification';
  const type = payload.data?.type;
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: payload.data?.notificationId || 'gestion-projet-notification',
    data: payload.data || {},
    actions: []
  };

  // Ajouter l'action de réponse pour les mentions
  if (type === 'mention') {
    notificationOptions.actions.push({
      action: 'reply',
      title: 'Répondre',
      type: 'text',
      placeholder: 'Écrire une réponse...'
    });
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  if (action === 'reply' && event.reply) {
    const replyText = event.reply;
    const projectId = data?.projectId;

    if (projectId) {
      // Envoyer la réponse directement à Firestore
      event.waitUntil(
        new Promise((resolve) => {
          // On essaie de récupérer l'utilisateur actuel
          // Note: auth.currentUser peut être nul si non persisté correctement
          const user = auth.currentUser;
          
          if (user) {
            db.collection('activities').add({
              projectId: projectId,
              type: 'project_discussion',
              actorId: user.uid,
              actorName: user.displayName || user.email || 'Membre',
              actorAvatar: user.photoURL || null,
              details: replyText,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
              // Mettre à jour le statut du projet pour les "non-lus"
              return db.collection('projects').doc(projectId).update({
                lastActivityAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActivityBy: user.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            }).then(resolve).catch(err => {
              console.error('Erreur Quick Reply SW:', err);
              resolve();
            });
          } else {
             // Fallback: Si pas d'user, on ouvre l'app pour gérer le reply
             clients.openWindow(`/?replyTo=${projectId}&text=${encodeURIComponent(replyText)}`).then(resolve);
          }
        })
      );
    }
    return;
  }

  // Comportement par défaut: ouvrir l'app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const targetUrl = data?.link || '/';
      
      for (let client of windowClients) {
        if (client.url.includes('/') && 'focus' in client) {
          if (targetUrl !== '/') {
             client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Stratégies de cache supplémentaires

// Cache pour les polices Google
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache pour les images (Cloudinary, etc.)
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// Gestion du Skip Waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
