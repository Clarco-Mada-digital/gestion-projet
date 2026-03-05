import { getFirestore, collection, query, where, onSnapshot, serverTimestamp, Timestamp, doc, updateDoc, writeBatch, getDocs, getDoc, addDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig, isFirebaseConfigured } from '../../lib/firebaseConfig';

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

interface BackgroundNotificationTask {
  id: string;
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  timestamp: number;
  userId?: string;
  taskId?: string;
}

class BackgroundNotificationService {
  private static instance: BackgroundNotificationService;
  private intervalId: NodeJS.Timeout | null = null;
  private sentNotifications: Map<string, string> = new Map(); // userId-date -> timestamp

  private constructor() {}

  public static getInstance(): BackgroundNotificationService {
    if (!BackgroundNotificationService.instance) {
      BackgroundNotificationService.instance = new BackgroundNotificationService();
    }
    return BackgroundNotificationService.instance;
  }

  /**
   * Démarre le service de vérification périodique
   */
  public start(): void {
    if (this.intervalId) {
      console.log('BackgroundNotificationService déjà démarré');
      return;
    }

    console.log('🚀 Démarrage du service de notifications périodique');
    
    // Vérifier immédiatement
    this.checkOverdueTasks();
    
    // Puis vérifier toutes les 5 minutes
    this.intervalId = setInterval(() => {
      this.checkOverdueTasks();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Arrête le service de vérification périodique
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹ Arrêt du service de notifications périodique');
    }
  }

  /**
   * Vérifie les tâches en retard et envoie les notifications
   */
  private async checkOverdueTasks(): Promise<void> {
    try {
      if (!ensureInitialized()) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toDateString();

      // Récupérer tous les projets et tâches
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const projects = projectsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      let allTasks: any[] = [];
      projects.forEach((project: any) => {
        if (project.tasks && Array.isArray(project.tasks)) {
          allTasks = allTasks.concat(project.tasks.map((task: any) => ({
            ...task,
            projectName: project.name,
            projectId: project.id
          })));
        }
      });

      // Filtrer les tâches en retard
      const overdueTasks = allTasks.filter((task: any) => {
        if (task.status === 'done' || task.status === 'non-suivi') return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
      });

      if (overdueTasks.length === 0) {
        console.log('✅ Aucune tâche en retard trouvée');
        return;
      }

      console.log(`📋 ${overdueTasks.length} tâches en retard trouvées`);

      // Grouper par projet pour éviter les doublons
      const tasksByProject = overdueTasks.reduce((acc, task) => {
        if (!acc[task.projectId]) {
          acc[task.projectId] = [];
        }
        acc[task.projectId].push(task);
        return acc;
      }, {} as Record<string, any[]>);

      // Envoyer les notifications pour chaque projet
      for (const [projectId, tasks] of Object.entries(tasksByProject)) {
        await this.sendProjectOverdueNotifications(projectId, tasks, todayString);
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des tâches en retard:', error);
    }
  }

  /**
   * Envoie les notifications pour un projet spécifique
   */
  private async sendProjectOverdueNotifications(
    projectId: string, 
    tasks: any[], 
    todayString: string
  ): Promise<void> {
    try {
      // Pour chaque tâche en retard du projet
      for (const task of tasks) {
        const notificationKey = `${projectId}-${task.id}-${todayString}`;
        
        // Vérifier si déjà notifié aujourd'hui
        if (this.sentNotifications.has(notificationKey)) {
          console.log(`⏭ Notification déjà envoyée aujourd'hui: ${task.title}`);
          continue;
        }

        // Envoyer la notification Firebase à tous les membres du projet
        await this.sendFirebaseNotification({
          id: `${projectId}-${task.id}-${todayString}`,
          userId: 'all', // Spécial pour envoyer à tout le monde
          title: '⚠️ Tâche en retard',
          message: `La tâche "${task.title}" du projet "${task.projectName}" est en retard!`,
          projectId: task.projectId,
          projectName: task.projectName,
          taskId: task.id,
          timestamp: Date.now()
        });

        // Marquer comme envoyé
        this.sentNotifications.set(notificationKey, todayString);
        
        // Petite pause pour éviter de surcharger Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Erreur lors de l'envoi des notifications pour le projet ${projectId}:`, error);
    }
  }

  /**
   * Envoie une notification Firebase
   */
  private async sendFirebaseNotification(notification: BackgroundNotificationTask): Promise<void> {
    if (!ensureInitialized()) return;

    try {
      // Récupérer tous les utilisateurs du projet
      const projectDoc = doc(db, 'projects', notification.projectId || '');
      const projectSnapshot = await getDoc(projectDoc);
      
      if (!projectSnapshot.exists()) {
        console.warn(`Projet ${notification.projectId} non trouvé`);
        return;
      }

      const project = projectSnapshot.data();
      if (!project || !project.ownerId) {
        console.warn(`Pas de propriétaire pour le projet ${notification.projectId}`);
        return;
      }

      // Envoyer au propriétaire du projet
      await addDoc(collection(db, 'notifications'), {
        userId: project.ownerId,
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: serverTimestamp(),
        projectId: notification.projectId,
        projectName: notification.projectName,
        taskId: notification.taskId
      });

      console.log(`📧 Notification Firebase envoyée: ${notification.title} à ${project.ownerId}`);

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification Firebase:', error);
    }
  }

  /**
   * Nettoie les anciennes notifications (plus de 30 jours)
   */
  public async cleanupOldNotifications(): Promise<void> {
    try {
      if (!ensureInitialized()) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const notificationsSnapshot = await getDocs(
        query(
          collection(db, 'notifications'),
          where('createdAt', '<', Timestamp.fromDate(thirtyDaysAgo))
        )
      );

      if (notificationsSnapshot.docs.length > 0) {
        const batch = writeBatch(db);
        notificationsSnapshot.docs.forEach((docSnapshot: any) => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
        console.log(`🗑️ Nettoyage de ${notificationsSnapshot.docs.length} anciennes notifications`);
      }

    } catch (error) {
      console.error('Erreur lors du nettoyage des notifications:', error);
    }
  }
}

export default BackgroundNotificationService;
