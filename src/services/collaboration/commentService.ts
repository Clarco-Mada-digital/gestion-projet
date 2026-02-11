import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';
import { Comment } from '../../types';

let db: any = null;

const ensureInitialized = () => {
  if (!db && isFirebaseConfigured()) {
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Firestore pour les commentaires:", error);
    }
  }
  return !!db;
};

export const commentService = {
  /**
   * Ajoute un commentaire à une tâche
   */
  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    if (!ensureInitialized()) return null;

    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        ...comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      return null;
    }
  },

  /**
   * Écoute les commentaires d'une tâche en temps réel
   */
  subscribeToTaskComments(taskId: string, callback: (comments: Comment[]) => void) {
    if (!ensureInitialized()) return () => { };

    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate().toISOString() : new Date().toISOString()
        } as Comment);
      });
      callback(comments);
    }, (error) => {
      console.error("Erreur lors de l'écoute des commentaires:", error);
    });
  },

  /**
   * Supprime un commentaire
   */
  async deleteComment(commentId: string): Promise<void> {
    if (!ensureInitialized()) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
    }
  }
};
