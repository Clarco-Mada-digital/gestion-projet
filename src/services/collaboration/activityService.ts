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
        lastActivityBy: auth.currentUser.uid,
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

    // On écoute toutes les activités du projet. 
    // Note: Sans orderBy, Firestore renvoie l'ordre des documents, ce qui peut varier.
    // On augmente le flux pour être sûr de ne rien rater d'important.
    const q = query(
      collection(db, 'activities'),
      where('projectId', '==', projectId)
    );

    return onSnapshot(q, (snapshot) => {
      const activities: Activity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Parsing robuste de la date (pour supporter Timestamp, String ou null)
        let dateIso: string;
        try {
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            dateIso = data.createdAt.toDate().toISOString();
          } else if (data.createdAt && typeof data.createdAt === 'string') {
            dateIso = data.createdAt;
          } else {
            dateIso = new Date().toISOString();
          }
        } catch (e) {
          dateIso = new Date().toISOString();
        }

        activities.push({
          id: doc.id,
          ...data,
          createdAt: dateIso
        } as Activity);
      });

      // Tri par date décroissante (plus récent d'abord)
      activities.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });

      // On renvoie un peu plus de messages (100 au lieu de 50) pour plus de confort
      const limitedActivities = activities.slice(0, 100);

      callback(limitedActivities);
    }, (error) => {
      console.error(`[Activities] Erreur abonnement projet ${projectId}:`, error);
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
  },
  /**
   * Ajoute ou retire une réaction emoji sur un message
   * STRATÉGIE DE CONTOURNEMENT : Au lieu de modifier le message d'origine (Permission Denied),
   * on crée une NOUVELLE activité de type 'reaction' liée au message cible (targetId).
   */
  async toggleReaction(activityId: string, emoji: string, userId: string, projectId: string): Promise<void> {
    if (!ensureInitialized() || !auth.currentUser || !userId || !projectId) return;

    try {
      const { getDocs } = await import('firebase/firestore');
      // On cherche si on a déjà mis cet emoji sur ce message
      const q = query(
        collection(db, 'activities'),
        where('type', '==', 'reaction'),
        where('targetId', '==', activityId),
        where('actorId', '==', userId),
        where('emoji', '==', emoji)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Supprimer la réaction existante
        await deleteDoc(doc(db, 'activities', snap.docs[0].id));
      } else {
        // Ajouter une nouvelle activité de réaction
        await addDoc(collection(db, 'activities'), {
          projectId,
          type: 'reaction',
          targetId: activityId,
          actorId: userId,
          actorName: auth.currentUser.displayName || 'Anonyme',
          emoji,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('[Reactions] Erreur contournement:', error);
      throw error;
    }
  }
};
