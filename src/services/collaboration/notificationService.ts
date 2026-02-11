import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Notification } from '../../types';

let db: any = null;

const ensureInitialized = () => {
  if (!db && isFirebaseConfigured()) {
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Firestore pour les notifications:", error);
    }
  }
  return !!db;
};

export const notificationService = {
  /**
   * Envoie une notification à un utilisateur
   */
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    if (!ensureInitialized()) return;

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
    if (!ensureInitialized()) return () => { };

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString()
        } as Notification);
      });
      callback(notifications);
    }, (error) => {
      console.error("Erreur lors de l'écoute des notifications:", error);
    });
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!ensureInitialized()) return;
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
  async markAllAsRead(userId: string, currentNotifications: Notification[]): Promise<void> {
    if (!ensureInitialized()) return;
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
  }
};
