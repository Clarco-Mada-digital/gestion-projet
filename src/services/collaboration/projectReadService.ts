import { doc, setDoc, serverTimestamp, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db, auth } from './firebaseService';

export interface ReadStatus {
  lastReadAt: string;
}

export const projectReadService = {
  /**
   * Marque un projet comme lu pour l'utilisateur actuel
   */
  async markAsRead(projectId: string): Promise<void> {
    if (!db || !auth.currentUser) return;

    try {
      const readStatusRef = doc(db, 'user_read_status', `${auth.currentUser.uid}_${projectId}`);
      await setDoc(readStatusRef, {
        lastReadAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        projectId: projectId
      }, { merge: true });
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  },

  /**
   * Écoute le statut de lecture d'un projet
   */
  subscribeToReadStatus(projectId: string, callback: (status: ReadStatus | null) => void) {
    if (!db || !auth.currentUser) return () => {};

    const readStatusRef = doc(db, 'user_read_status', `${auth.currentUser.uid}_${projectId}`);
    
    return onSnapshot(readStatusRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          lastReadAt: data.lastReadAt ? data.lastReadAt.toDate().toISOString() : new Date(0).toISOString()
        });
      } else {
        callback(null);
      }
    });
  },

  /**
   * Écoute TOUS les statuts de lecture de l'utilisateur (pour les badges sur les cartes)
   */
  subscribeToAllReadStatuses(userId: string, callback: (statuses: Record<string, string>) => void) {
     if (!db) return () => {};
     
     const q = query(collection(db, 'user_read_status'), where('userId', '==', userId));
     
     return onSnapshot(q, (snapshot) => {
       const statuses: Record<string, string> = {};
       snapshot.forEach(docSnap => {
         const data = docSnap.data();
         if (data.projectId && data.lastReadAt) {
           statuses[data.projectId] = data.lastReadAt.toDate().toISOString();
         }
       });
       callback(statuses);
     });
  }
};
