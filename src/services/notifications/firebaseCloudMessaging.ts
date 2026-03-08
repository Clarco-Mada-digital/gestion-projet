import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { auth, db, app } from '../../services/collaboration/firebaseService';
import { doc, updateDoc } from 'firebase/firestore';

let messaging: any = null;
let isInitialized = false;

const ensureInitialized = () => {
  if (!isInitialized && isFirebaseConfigured()) {
    try {
      if (app) {
        messaging = getMessaging(app);
        isInitialized = true;
        console.log('Firebase Messaging initialisé via app centralisée');
      }
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
  private registration: ServiceWorkerRegistration | null = null;
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

    // Vérifier si l'utilisateur est authentifié
    if (!auth.currentUser) {
      console.log('FCM désactivé : utilisateur non connecté');
      return null;
    }

    try {
      // Vérifier si le service worker est supporté
      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker non supporté');
        return null;
      }

      // S'assurer que le service worker est prêt (déjà géré par la PWA ou le navigateur)
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker prêt pour FCM:', registration.scope);

      // Demander la permission pour les notifications
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permission de notification refusée');
        return null;
      }

      // Obtenir le token FCM
      const token = await getToken(messaging, {
        vapidKey: 'BNDZS_Luenj7SMWjh7fuEOeK593aBTkk-8HZBhtimPtjnEl2Uk3Q-vaYFhxPb14y5EDeu3ZrJsd16XbQuUua07A',
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
      if (!auth.currentUser) return;

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fcmToken: token,
        updatedAt: new Date().toISOString()
      });

      console.log('Token FCM sauvegardé dans Firestore');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token FCM:', error);
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
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      badge: '/icons/favicon-32x32.png',
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
      
      if (this.registration) {
        await this.registration.unregister();
        this.registration = null;
        console.log('Service Worker désenregistré');
      }
      
      // Notifier Firestore de la suppression du token
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: null,
          updatedAt: new Date().toISOString()
        });
      }
      
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
    
    if (this.registration) {
      this.registration.unregister();
      this.registration = null;
    }
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
