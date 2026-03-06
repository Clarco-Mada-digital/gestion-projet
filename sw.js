// Service Worker pour Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAiEu-xlbONd1jKwlRKCMhHrgLWvCNPnsc",
  authDomain: "gestion-projet-b8c77.firebaseapp.com",
  projectId: "gestion-projet-b8c77",
  storageBucket: "gestion-projet-b8c77.firebasestorage.app",
  messagingSenderId: "650111904365",
  appId: "1:650111904365:web:478c0f1c9c8445e357ad64"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Message en arrière-plan reçu ', payload);

  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'gestion-projet-notification',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[sw.js] Clic sur notification');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Vérifier si une fenêtre de l'app est déjà ouverte
      for (let client of windowClients) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
