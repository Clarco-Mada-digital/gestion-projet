import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  limit, 
  Timestamp, 
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseService';
import { ProjectFeedItem } from '../../types';

export class FeedService {
  private static COLLECTION = 'project_feed';

  /**
   * Envoie un message ou une activité dans le flux du projet
   */
  public static async addItem(item: Omit<ProjectFeedItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      const feedRef = collection(db, this.COLLECTION);
      const docRef = await addDoc(feedRef, {
        ...item,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout au flux projet:', error);
      throw error;
    }
  }

  /**
   * Écoute les nouveaux éléments du flux pour un projet donné
   */
  public static subscribeToFeed(projectId: string, callback: (items: ProjectFeedItem[]) => void) {
    if (!db) return () => {};
    
    const feedRef = collection(db, this.COLLECTION);
    const q = query(
      feedRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString()
        } as ProjectFeedItem;
      });
      callback(items);
    }, (error) => {
      console.error('Erreur lors de l\'écoute du flux projet:', error);
    });
  }

  /**
   * Marque les éléments comme lus pour un utilisateur spécifique
   */
  public static async markAsRead(items: ProjectFeedItem[], userId: string): Promise<void> {
    const batch = writeBatch(db);
    let count = 0;

    items.forEach(item => {
      if (!item.isReadBy?.includes(userId)) {
        const docRef = doc(db, this.COLLECTION, item.id);
        const updatedIsReadBy = [...(item.isReadBy || []), userId];
        batch.update(docRef, { isReadBy: updatedIsReadBy });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
  }
}
