import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Activity } from '../../types';

let db: any = null;

const ensureInitialized = () => {
  if (!db && isFirebaseConfigured()) {
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Firestore pour les activités:", error);
    }
  }
  return !!db;
};

export const activityService = {
  /**
   * Enregistre une nouvelle activité
   */
  async logActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
    if (!ensureInitialized()) return;

    try {
      await addDoc(collection(db, 'activities'), {
        ...activity,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'activité:", error);
    }
  },

  /**
   * Écoute les activités d'un projet en temps réel
   */
  subscribeToProjectActivities(projectId: string, callback: (activities: Activity[]) => void) {
    if (!ensureInitialized()) return () => { };

    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const activities: Activity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString()
        } as Activity);
      });

      // Tri et limitation côté client pour éviter la création d'index composite Firebase
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limitedActivities = activities.slice(0, 50);

      callback(limitedActivities);
    }, (error) => {
      console.error("Erreur lors de l'écoute des activités:", error);
    });
  }
};
