import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';

let messaging: any = null;
let isInitialized = false;

const ensureInitialized = () => {
  if (!isInitialized && isFirebaseConfigured()) {
    try {
      const app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
      isInitialized = true;
      console.log('Firebase Messaging initialisé');
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Firebase Messaging:", error);
    }
  }
  return !!messaging;
};

export class FirebaseCloudMessaging {
  private static instance: FirebaseCloudMessaging;
  private currentToken: string | null = null;
  private unsubscribeHandlers: (() => void)[] = [];

  private constructor() {
    ensureInitialized();
  }

  public static getInstance(): FirebaseCloudMessaging {
    if (!FirebaseCloudMessaging.instance) {
      FirebaseCloudMessaging.instance = new FirebaseCloudMessaging();
    }
    return FirebaseCloudMessaging.instance;
  }

  /**
   * Demander la permission et obtenir le token FCM
   */
  public async requestPermissionAndGetToken(): Promise<string | null> {
    if (!ensureInitialized()) {
      console.error('Firebase Messaging non disponible');
      return null;
    }

    try {
      // Vérifier si le service worker est supporté
      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker non supporté');
        return null;
      }

      // S'assurer que le service worker est enregistré
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré pour FCM');

      // Demander la permission pour les notifications
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permission de notification refusée');
        return null;
      }

      // Obtenir le token FCM
      const token = await getToken(messaging, {
        vapidKey: 'BMz1kY8l6J4x7S9n2P5qR8tW3v6X9zA1C4D7E0F2G5H8I1J3K6L9M0N3O6P9Q2R5S8T1U4V7W0X3Z6A9B2C5E8F1G4H7I0J3K6L9M0N3O6P9Q2R5S8T1U4V7W0X3Z6',
        serviceWorkerRegistration: registration
      });

      if (token) {
        this.currentToken = token;
        console.log('Token FCM obtenu:', token);
        
        // Sauvegarder le token dans localStorage pour le debugging
        localStorage.setItem('fcm_token', token);
        
        // Envoyer le token au serveur
        await this.sendTokenToServer(token);
        
        return token;
      } else {
        console.error('Impossible d\'obtenir le token FCM');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token FCM:', error);
      return null;
    }
  }

  /**
   * Envoyer le token au serveur pour les notifications push
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const response = await fetch('/api/fcm/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du token au serveur');
      }

      console.log('Token FCM envoyé au serveur avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du token:', error);
    }
  }

  /**
   * Écouter les messages en avant-plan
   */
  public onMessage(callback: (payload: any) => void): void {
    if (!ensureInitialized()) {
      console.error('Firebase Messaging non disponible');
      return;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message FCM reçu en avant-plan:', payload);
      
      // Afficher la notification même en avant-plan
      if (payload.notification) {
        this.showForegroundNotification(payload);
      }
      
      callback(payload);
    });

    this.unsubscribeHandlers.push(unsubscribe);
  }

  /**
   * Afficher une notification en avant-plan
   */
  private showForegroundNotification(payload: any): void {
    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/icons/notification-bell.png',
      badge: '/icons/badge.png',
      tag: payload.tag || `foreground-${Date.now()}`,
      requireInteraction: false,
      data: payload.data || {},
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        },
        {
          action: 'dismiss',
          title: 'Ignorer'
        }
      ]
    };

    // Utiliser l'API Notification du navigateur pour l'avant-plan
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, notificationOptions);
      
      // Gérer le clic
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();
        
        // Naviguer vers le lien approprié
        const targetUrl = payload.data?.link || '/';
        if (targetUrl !== '/') {
          window.location.href = targetUrl;
        }
      };
      
      // Auto-fermeture après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  /**
   * Supprimer le token FCM (logout)
   */
  public async deleteToken(): Promise<boolean> {
    if (!ensureInitialized() || !this.currentToken) {
      return false;
    }

    try {
      await deleteToken(messaging);
      this.currentToken = null;
      localStorage.removeItem('fcm_token');
      
      // Notifier le serveur de la suppression du token
      await fetch('/api/fcm/token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.currentToken })
      });
      
      console.log('Token FCM supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du token FCM:', error);
      return false;
    }
  }

  /**
   * Obtenir le token actuel
   */
  public getCurrentToken(): string | null {
    return this.currentToken || localStorage.getItem('fcm_token');
  }

  /**
   * Vérifier si FCM est supporté
   */
  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && isFirebaseConfigured();
  }

  /**
   * Nettoyer les abonnements
   */
  public cleanup(): void {
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }

  /**
   * Envoyer une notification de test
   */
  public async sendTestNotification(): Promise<void> {
    if (!this.currentToken) {
      console.error('Aucun token FCM disponible');
      return;
    }

    try {
      const response = await fetch('/api/fcm/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: this.currentToken,
          title: 'Notification de test',
          body: 'Ceci est une notification de test de ProjectFlow',
          data: {
            type: 'test',
            link: '/'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la notification de test');
      }

      console.log('Notification de test envoyée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
    }
  }
}

export default FirebaseCloudMessaging;
