// Service de notifications push avec meilleure expérience utilisateur

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
  silent?: boolean;
  vibrate?: number[];
  sound?: string;
  onClick?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  onShow?: () => void;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private isSupported: boolean = false;
  private subscription: PushSubscription | null = null;
  private notificationQueue: Map<string, PushNotificationOptions> = new Map();
  private activeNotifications: Set<string> = new Set();

  private constructor() {
    this.checkSupport();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private checkSupport(): void {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (this.isSupported) {
      // Vérifier si le service worker est déjà enregistré
      navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker prêt pour les notifications');
      }).catch(error => {
        console.error('Service Worker non disponible:', error);
      });
    }
  }

  public getSupportStatus(): boolean {
    return this.isSupported;
  }

  public async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return { granted: false, denied: false, default: false };
    }

    const permission = await Notification.requestPermission();
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Les notifications push ne sont pas supportées par ce navigateur');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Enregistrer le service worker si nécessaire
        await this.registerServiceWorker();
        return true;
      } else if (permission === 'denied') {
        console.warn('L\'utilisateur a refusé les notifications');
        return false;
      } else {
        console.log('L\'utilisateur n\'a pas encore pris de décision');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', registration);
      
      // S'abonner aux push notifications
      await this.subscribeToPush(registration);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du service worker:', error);
    }
  }

  private async subscribeToPush(registration: ServiceWorkerRegistration): Promise<void> {
    try {
      // Vérifier si déjà abonné
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (!existingSubscription) {
        // Créer un nouvel abonnement
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.getApplicationServerKey()
        });
        
        this.subscription = subscription;
        console.log('Abonnement aux push notifications créé:', subscription);
        
        // Envoyer l'abonnement au serveur
        await this.sendSubscriptionToServer(subscription);
      } else {
        this.subscription = existingSubscription;
        console.log('Déjà abonné aux push notifications');
      }
    } catch (error) {
      console.error('Erreur lors de l\'abonnement aux push notifications:', error);
    }
  }

  private getApplicationServerKey(): string {
    // Clé VAPID publique (à remplacer par votre clé réelle)
    return 'BMz1kY8l6J4x7S9n2P5qR8tW3v6X9zA1C4D7E0F2G5H8I1J3K6L9M0N3O6P9Q2R5S8T1U4V7W0X3Z6A9B2C5E8F1G4H7I0J3K6L9M0N3O6P9Q2R5S8T1U4V7W0X3Z6';
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // Envoyer l'abonnement à votre backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'abonnement au serveur');
      }

      console.log('Abonnement envoyé au serveur avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'abonnement:', error);
    }
  }

  public async showNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.isSupported) {
      console.warn('Les notifications push ne sont pas supportées');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission de notification refusée');
      return;
    }

    try {
      // Créer une notification unique
      const notificationId = this.generateNotificationId(options);
      
      // Éviter les doublons
      if (this.activeNotifications.has(notificationId)) {
        console.log('Notification déjà active:', notificationId);
        return;
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        image: options.image,
        tag: options.tag || notificationId,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        vibrate: options.vibrate,
        sound: options.sound,
        data: options.data || { notificationId }
      });

      // Ajouter les actions si spécifiées
      if (options.actions && options.actions.length > 0) {
        // Note: Les actions ne sont pas supportées sur tous les navigateurs
        // Elles seront gérées par le service worker
      }

      // Gérer les événements
      this.setupNotificationEvents(notification, options);

      // Marquer comme active
      this.activeNotifications.add(notificationId);

      // Auto-nettoyage après 10 secondes si pas d'interaction requise
      if (!options.requireInteraction) {
        setTimeout(() => {
          this.activeNotifications.delete(notificationId);
        }, 10000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
      options.onError?.(error as Error);
    }
  }

  private setupNotificationEvents(notification: Notification, options: PushNotificationOptions): void {
    notification.onclick = (event) => {
      event.preventDefault();
      options.onClick?.();
      notification.close();
    };

    notification.onclose = () => {
      options.onClose?.();
    };

    notification.onerror = (event) => {
      const error = new Error('Erreur de notification');
      options.onError?.(error);
    };

    notification.onshow = () => {
      options.onShow?.();
    };
  }

  private generateNotificationId(options: PushNotificationOptions): string {
    return `${options.title}-${options.body}-${Date.now()}`;
  }

  public async scheduleNotification(options: PushNotificationOptions, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(options);
    }, delay);
  }

  public clearAllNotifications(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      Notification.getNotifications().forEach(notification => {
        notification.close();
      });
    }
    this.activeNotifications.clear();
  }

  public async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
      }

      // Révoquer la permission de notification
      if ('Notification' in window && Notification.permission === 'granted') {
        // Note: On ne peut pas révoquer directement la permission
        // Mais on peut nettoyer l'abonnement local
        this.activeNotifications.clear();
      }

      console.log('Désinscrit des push notifications');
      return true;
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
      return false;
    }
  }

  // Notifications prédéfinies pour les tâches
  public async showTaskReminder(task: any): Promise<void> {
    const projectName = task.projectName || task.project?.name || 'Projet inconnu';
    
    await this.showNotification({
      title: '📅 Rappel de tâche',
      body: `La tâche "${task.title}" du projet "${projectName}" est due aujourd'hui!`,
      icon: '/icons/task-reminder.png',
      tag: `task-reminder-${task.id}`,
      requireInteraction: false,
      actions: [
        {
          action: 'view-task',
          title: 'Voir la tâche',
          icon: '/icons/view.png'
        },
        {
          action: 'complete-task',
          title: 'Marquer comme terminée',
          icon: '/icons/complete.png'
        }
      ],
      data: { 
        taskId: task.id, 
        projectId: task.projectId || task.project?.id,
        type: 'task-reminder',
        projectName: projectName
      },
      onClick: () => {
        // Utiliser les données directes si disponibles
        if (task.projectId || task.project?.id) {
          window.location.href = `/projects/${task.projectId || task.project?.id}?task=${task.id}`;
        } else {
          // Fallback au lien si disponible
          window.location.href = task.link || `/projects/${task.projectId || task.project?.id}?task=${task.id}`;
        }
      }
    });
  }

  public async showTaskOverdue(task: any): Promise<void> {
    const projectName = task.projectName || task.project?.name || 'Projet inconnu';
    
    await this.showNotification({
      title: '⚠️ Tâche en retard',
      body: `La tâche "${task.title}" du projet "${projectName}" est en retard de ${this.getDaysOverdue(task.dueDate)} jours!`,
      icon: '/icons/overdue.png',
      tag: `task-overdue-${task.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { 
        taskId: task.id, 
        projectId: task.projectId || task.project?.id,
        type: 'task-overdue',
        projectName: projectName
      },
      onClick: () => {
        // Utiliser les données directes si disponibles
        if (task.projectId || task.project?.id) {
          window.location.href = `/projects/${task.projectId || task.project?.id}?task=${task.id}`;
        } else {
          // Fallback au lien si disponible
          window.location.href = task.link || `/projects/${task.projectId || task.project?.id}?task=${task.id}`;
        }
      }
    });
  }

  public async showTaskCompleted(task: any): Promise<void> {
    await this.showNotification({
      title: '🎉 Tâche terminée!',
      body: `Félicitations! La tâche "${task.title}" a été terminée.`,
      icon: '/icons/complete.png',
      tag: `task-completed-${task.id}`,
      silent: false,
      vibrate: [100, 50, 100],
      data: { taskId: task.id, type: 'task-completed' }
    });
  }

  public async showProjectMilestone(project: any): Promise<void> {
    const completedTasks = project.tasks.filter((t: any) => t.status === 'done').length;
    const totalTasks = project.tasks.length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);

    await this.showNotification({
      title: `📊 Jalon du projet "${project.name}"`,
      body: `${completedTasks}/${totalTasks} tâches terminées (${percentage}%)`,
      icon: '/icons/milestone.png',
      tag: `project-milestone-${project.id}`,
      data: { projectId: project.id, type: 'project-milestone' },
      onClick: () => {
        window.location.href = `/projects/${project.id}`;
      }
    });
  }

  private getDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default PushNotificationService;
