import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Activity } from '../../types';
import { db, auth } from './firebaseService';

const ensureInitialized = () => {
  return !!db;
};

export const activityService = {
  /**
   * Enregistre une nouvelle activité et met à jour le projet
   */
  async logActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;

    try {
      const activitiesRef = collection(db, 'activities');
      await addDoc(activitiesRef, {
        ...activity,
        createdAt: serverTimestamp()
      });

      // Mettre à jour le timestamp du projet pour le badge "non lu"
      const projectRef = doc(db, 'projects', activity.projectId);
      await updateDoc(projectRef, {
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'activité:", error);
    }
  },

  /**
   * Écoute les activités d'un projet en temps réel
   */
  subscribeToProjectActivities(projectId: string, callback: (activities: Activity[]) => void) {
    if (!ensureInitialized() || !auth.currentUser) return () => { };

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

      // Tri et limitation côté client
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const limitedActivities = activities.slice(0, 50);

      callback(limitedActivities);
    }, (error) => {
      console.error("Erreur lors de l'écoute des activités:", error);
    });
  },

  /**
   * Met à jour une activité existante
   */
  async updateActivity(activityId: string, details: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;
    try {
      const activityRef = doc(db, 'activities', activityId);
      await updateDoc(activityRef, {
        details,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erreur mise à jour activité:", error);
    }
  },

  /**
   * Supprime une activité
   */
  async deleteActivity(activityId: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser) return;
    try {
      const activityRef = doc(db, 'activities', activityId);
      await deleteDoc(activityRef);
    } catch (error) {
      console.error("Erreur suppression activité:", error);
    }
  },

  /**
   * Supprime plusieurs activités d'un coup
   */
  async deleteMultipleActivities(activityIds: string[]): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser || activityIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      activityIds.forEach(id => {
        batch.delete(doc(db, 'activities', id));
      });
      await batch.commit();
    } catch (error) {
      console.error("Erreur suppression multiple activités:", error);
    }
  }
};
