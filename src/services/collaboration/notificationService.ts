import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Notification } from '../../types';
import { db, auth } from './firebaseService';

const ensureInitialized = () => {
  return !!db;
};

export const notificationService = {
  /**
   * Envoie une notification à un utilisateur
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error);
    }
  },

  /**
   * Écoute les notifications d'un utilisateur en temps réel
   */
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: any = null;
    let attempts = 0;
    const maxAttempts = 5;

    const startListening = () => {
      // Nettoyage préalable
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      if (!ensureInitialized() || !auth.currentUser) {
        console.warn("[NotificationService] En attente d'authentification pour l'écoute...");
        // Réessayer dans 1.5s si on n'a pas encore l'utilisateur
        if (attempts < maxAttempts) {
          attempts++;
          retryTimeout = setTimeout(startListening, 1500);
        }
        return;
      }

      const currentAuthUid = auth.currentUser?.uid;
      console.log(`[NotificationService] Démarrage de l'écoute pour ${userId} (Tentative ${attempts + 1}). Auth CurrentUser: ${currentAuthUid}`);
      
      if (currentAuthUid !== userId) {
        console.warn(`[NotificationService] Attention: L'UID de la requête (${userId}) est différent de l'UID Firebase Auth (${currentAuthUid})`);
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        attempts = 0; // Reset on success
        const notifications: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString()
          } as Notification);
        });

        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(notifications);
      }, (error) => {
        console.error("Erreur lors de l'écoute des notifications:", error);
        
        // Si c'est une erreur de permission, on réessaie car request.auth peut être null temporairement dans les règles
        if (error.code === 'permission-denied' && attempts < maxAttempts) {
          attempts++;
          console.warn(`[NotificationService] Erreur de permission, nouvelle tentative dans 3s... (${attempts}/${maxAttempts})`);
          retryTimeout = setTimeout(startListening, 3000);
        }
      });
    };

    startListening();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
    }
  },

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(currentNotifications: Notification[]): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;
    try {
      const unread = currentNotifications.filter(n => !n.isRead);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Erreur lors du marquage groupé des notifications:", error);
    }
  },

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error);
    }
  },

  /**
   * Supprime toutes les notifications d'un utilisateur
   */
  async clearAllNotifications(userId: string, notifications: Notification[]): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser || notifications.length === 0) return;
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
    } catch (error) {
      console.error("Erreur lors du nettoyage des notifications:", error);
    }
  }
};
