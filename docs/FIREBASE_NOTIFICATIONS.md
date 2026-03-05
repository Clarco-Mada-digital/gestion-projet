# Configuration des Notifications Push Firebase

Ce guide explique comment configurer les notifications push Firebase dans ProjectFlow pour recevoir des notifications même quand l'application est fermée.

## Prérequis

1. **Firebase Project** configuré avec Firebase Cloud Messaging (FCM)
2. **Navigateur moderne** supportant les Service Workers et les notifications push
3. **HTTPS** requis pour les notifications push (déjà configuré en production)

## Fonctionnalités

### 1. Notifications Locales (PWA)
- Fonctionnent quand l'application est ouverte
- Utilisent l'API Notification du navigateur
- Gérées par le `PushNotificationService`

### 2. Notifications Cloud (Firebase)
- Fonctionnent même quand l'application est fermée
- Utilisent Firebase Cloud Messaging
- Nécessitent un token FCM valide

## Configuration

### 1. Configuration Firebase

Dans `src/lib/firebaseConfig.ts`:
```typescript
export const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "votre-sender-id",
  appId: "votre-app-id",
  measurementId: "votre-measurement-id"
};
```

### 2. Clé VAPID

La clé VAPID est configurée dans:
- `src/services/notifications/pushNotificationService.ts` (ligne 156)
- `src/services/notifications/firebaseCloudMessaging.ts` (ligne 67)

### 3. Service Worker

Le Service Worker `/public/sw.js` gère:
- Les notifications push en arrière-plan
- Le cache pour le mode hors-ligne
- Les clics sur les notifications

## Utilisation

### Activation des Notifications

1. Allez dans **Paramètres > Notifications**
2. Cliquez sur **"Activer les notifications"**
3. Acceptez la permission du navigateur
4. Activez **"Notifications Cloud (Firebase)"** pour les notifications hors-ligne

### Types de Notifications

- **Rappels de tâches**: Quand une tâche est due aujourd'hui
- **Tâches en retard**: Quand une tâche est en retard
- **Tâches terminées**: Quand une tâche est marquée comme terminée
- **Jalons de projet**: Pour les jalons importants
- **Notifications Cloud**: Reçoit les notifications Firebase même hors-ligne

### Heures de Silence

Configurez des heures pendant lesquelles les notifications sont silencieuses:
- Activé/Désactivé
- Heure de début (ex: 22:00)
- Heure de fin (ex: 08:00)

## Architecture Technique

### Services Impliqués

1. **PushNotificationService** (`src/services/notifications/pushNotificationService.ts`)
   - Gère les notifications locales PWA
   - Interface avec le Service Worker

2. **FirebaseCloudMessaging** (`src/services/notifications/firebaseCloudMessaging.ts`)
   - Gère les tokens FCM
   - Interface avec Firebase Cloud Messaging

3. **NotificationCenter** (`src/components/UI/NotificationCenter.tsx`)
   - Affiche les notifications dans l'UI
   - Détecte les nouvelles notifications Firebase
   - Déclenche les notifications push locales

4. **useNotifications** Hook (`src/hooks/useNotifications.ts`)
   - Logique de notification centralisée
   - Gestion des paramètres utilisateur

### Flux de Notification

1. **Notification Firebase** → Service Worker → Notification système
2. **Notification Locale** → PushNotificationService → Notification système
3. **Nouvelle notification Firebase** → NotificationCenter → Notification push locale

## Dépannage

### Problèmes Courants

1. **Notifications non reçues**
   - Vérifiez que le navigateur supporte les notifications
   - Vérifiez que la permission est accordée
   - Vérifiez que le Service Worker est actif

2. **Notifications Firebase non reçues**
   - Vérifiez la configuration Firebase
   - Vérifiez que le token FCM est valide
   - Vérifiez les logs du Service Worker

3. **Notifications en double**
   - Les notifications Firebase et locales peuvent se chevaucher
   - Vérifiez les tags uniques pour éviter les doublons

### Debugging

Ouvrez les outils de développement et vérifiez:
- **Console**: Messages du Service Worker
- **Application**: Service Workers et Notifications
- **Network**: Requêtes FCM

## API Backend (Optionnel)

Pour envoyer des notifications depuis le backend:

```typescript
// POST /api/fcm/send-notification
{
  "token": "fcm-token",
  "notification": {
    "title": "Titre de la notification",
    "body": "Contenu de la notification",
    "icon": "/icons/notification-bell.png"
  },
  "data": {
    "type": "task-reminder",
    "projectId": "project-id",
    "taskId": "task-id",
    "link": "/projects/project-id?task=task-id"
  }
}
```

## Sécurité

- Les tokens FCM sont uniques par utilisateur/navigateur
- Les permissions sont gérées par le navigateur
- Les notifications sensibles ne doivent pas contenir d'informations critiques

## Performance

- Le Service Worker met en cache les ressources statiques
- Les notifications sont limitées pour éviter le spam
- Le cleanup automatique évite les fuites de mémoire

## Notes de Version

- **v1.0**: Notifications locales PWA
- **v2.0**: Intégration Firebase Cloud Messaging
- **v2.1**: Service Worker amélioré avec gestion Firebase
- **v2.2**: Interface utilisateur de configuration
