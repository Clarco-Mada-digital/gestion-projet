import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import PushNotificationService, { PushNotificationOptions } from '../services/notifications/pushNotificationService';
import { Task, Project, TaskStatus } from '../types';

export const useNotifications = () => {
  const { state } = useApp();
  const notificationService = PushNotificationService.getInstance();
  
  // Référence pour tracker les notifications déjà envoyées
  const sentNotifications = useRef<Set<string>>(new Set());

  // Initialiser les settings par défaut si manquants
  useEffect(() => {
    const existingSettings = localStorage.getItem('notificationSettings');
    if (!existingSettings) {
      const defaultSettings = {
        pushNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        mentions: true,
        taskReminders: true,
        taskOverdue: true,
        taskCompleted: true
      };
      localStorage.setItem('notificationSettings', JSON.stringify(defaultSettings));
    }
  }, []);

  const canShowNotifications = useCallback(() => {
    const settings = localStorage.getItem('notificationSettings');
    if (!settings) return false;
    
    const notificationSettings = JSON.parse(settings);
    return state.appSettings?.pushNotifications === true && !!notificationSettings;
  }, [state.appSettings]);

  const isQuietHours = useCallback(() => {
    const settings = localStorage.getItem('notificationSettings');
    if (!settings) return false;
    
    const notificationSettings = JSON.parse(settings);
    if (!notificationSettings.quietHours?.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    return currentTime >= notificationSettings.quietHours.start || currentTime <= notificationSettings.quietHours.end;
  }, []);

  // Vérifier si un projet est suivi
  const isProjectFollowed = useCallback((projectId: string): boolean => {
    const project = state.projects.find(p => p.id === projectId);
    return project?.isFollowed ?? true; // Par défaut, les projets sont suivis
  }, [state.projects]);

  // Vérifier si une tâche doit avoir des notifications
  const shouldShowTaskNotification = useCallback((task: Task): boolean => {
    // Ne pas notifier pour les tâches non suivies
    if (task.status === 'non-suivi') {
      return false;
    }

    // Ne pas notifier si le projet n'est pas suivi
    if (!isProjectFollowed(task.projectId)) {
      return false;
    }

    return true;
  }, [isProjectFollowed]);

  // Générer un ID unique pour éviter les notifications dupliquées
  const getNotificationId = useCallback((type: string, entityId: string, additionalInfo?: string): string => {
    return `${type}-${entityId}-${additionalInfo || ''}`;
  }, []);

  // Vérifier si la notification a déjà été envoyée
  const wasNotificationSent = useCallback((notificationId: string): boolean => {
    return sentNotifications.current.has(notificationId);
  }, []);

  // Marquer une notification comme envoyée
  const markNotificationAsSent = useCallback((notificationId: string): void => {
    sentNotifications.current.add(notificationId);
  }, []);

  const showNotification = useCallback(async (options: PushNotificationOptions) => {
    if (!canShowNotifications() || isQuietHours()) {
      console.log('Notification bloquée (paramètres ou heures de silence)');
      return;
    }

    await notificationService.showNotification(options);
  }, [canShowNotifications, isQuietHours]);

  const showTaskReminder = useCallback(async (task: Task) => {
    if (!canShowNotifications() || isQuietHours()) return;
    
    if (!shouldShowTaskNotification(task)) return;

    const notificationId = getNotificationId('reminder', task.id, task.dueDate);
    if (wasNotificationSent(notificationId)) {
      return;
    }

    await notificationService.showTaskReminder(task);
    markNotificationAsSent(notificationId);
  }, [canShowNotifications, isQuietHours, shouldShowTaskNotification, getNotificationId, wasNotificationSent, markNotificationAsSent]);

  const showTaskOverdue = useCallback(async (task: Task) => {
    if (!canShowNotifications() || isQuietHours()) return;
    
    if (!shouldShowTaskNotification(task)) return;

    const notificationId = getNotificationId('overdue', task.id, task.dueDate);
    if (wasNotificationSent(notificationId)) {
      return;
    }

    // 1. Envoyer la notification push locale
    await notificationService.showTaskOverdue(task);
    
    // 2. Sauvegarder dans Firebase pour le NotificationCenter
    try {
      const { default: notificationService } = await import('../services/collaboration/notificationService');
      if (state.cloudUser) {
        const project = state.projects.find(p => p.id === task.projectId);
        await notificationService.sendNotification({
          userId: state.cloudUser.uid,
          title: '⚠️ Tâche en retard',
          message: `La tâche "${task.title}" du projet "${project?.name || 'Projet inconnu'}" est en retard de plusieurs jours!`,
          type: 'deadline_approaching',
          link: `/projects/${task.projectId}?task=${task.id}`,
          projectId: task.projectId,
          taskId: task.id,
          projectName: project?.name || 'Projet inconnu'
        });
      }
    } catch (error) {
      // Erreur silencieuse
    }
    
    markNotificationAsSent(notificationId);
  }, [canShowNotifications, isQuietHours, shouldShowTaskNotification, getNotificationId, wasNotificationSent, markNotificationAsSent, state.cloudUser, state.projects]);

  const showTaskCompleted = useCallback(async (task: Task) => {
    if (!canShowNotifications() || isQuietHours()) return;
    
    if (!shouldShowTaskNotification(task)) return;

    const notificationId = getNotificationId('completed', task.id, task.updatedAt);
    if (wasNotificationSent(notificationId)) {
      return;
    }

    // 1. Envoyer la notification push locale
    await notificationService.showTaskCompleted(task);
    
    // 2. Sauvegarder dans Firebase pour le créateur du projet uniquement
    try {
      const { default: notificationService } = await import('../services/collaboration/notificationService');
      const project = state.projects.find(p => p.id === task.projectId);
      
      if (project && state.cloudUser) {
        // Notifier seulement le créateur du projet, et seulement si ce n'est pas lui qui a terminé la tâche
        if (project.ownerId && project.ownerId !== state.cloudUser.uid) {
          await notificationService.sendNotification({
            userId: project.ownerId,
            title: '🎉 Tâche terminée!',
            message: `La tâche "${task.title}" du projet "${project.name}" a été terminée par ${state.cloudUser.displayName || 'un membre'}.`,
            type: 'task_completed',
            link: `/projects/${task.projectId}?task=${task.id}`,
            projectId: task.projectId,
            taskId: task.id,
            projectName: project.name || 'Projet inconnu'
          });
        }
      }
    } catch (error) {
      // Erreur silencieuse
    }
    
    markNotificationAsSent(notificationId);
  }, [canShowNotifications, isQuietHours, shouldShowTaskNotification, getNotificationId, wasNotificationSent, markNotificationAsSent, state.cloudUser, state.projects]);

  const showProjectMilestone = useCallback(async (project: Project) => {
    if (!canShowNotifications() || isQuietHours()) return;
    
    // Ne pas notifier pour les projets non suivis
    if (!project.isFollowed) {
      console.log('Notification bloquée : projet non suivi');
      return;
    }

    const notificationId = getNotificationId('milestone', project.id, project.updatedAt);
    if (wasNotificationSent(notificationId)) {
      console.log('Notification de jalon déjà envoyée pour le projet:', project.id);
      return;
    }

    await notificationService.showProjectMilestone(project);
    markNotificationAsSent(notificationId);
  }, [canShowNotifications, isQuietHours, getNotificationId, wasNotificationSent, markNotificationAsSent]);

  const showCustomNotification = useCallback(async (title: string, body: string, options?: Partial<PushNotificationOptions>) => {
    if (!canShowNotifications() || isQuietHours()) return;
    
    await notificationService.showNotification({
      title,
      body,
      ...options
    });
  }, [canShowNotifications, isQuietHours]);

  const scheduleNotification = useCallback(async (options: PushNotificationOptions, delay: number) => {
    if (!canShowNotifications()) return;
    
    const unsubscribe = notificationService.subscribeToNotifications(state.cloudUser.uid, (fetched: any[]) => {
      setCloudNotifications(fetched);
    });
    return () => unsubscribe;
  }, [canShowNotifications, state.cloudUser]);

  const clearAllNotifications = useCallback(() => {
    notificationService.clearAllNotifications();
    // Réinitialiser le tracking des notifications envoyées
    sentNotifications.current.clear();
  }, []);

  // Réinitialiser le tracking des notifications quand les projets/tâches changent significativement
  useEffect(() => {
    // Réinitialiser périodiquement pour éviter les fuites de mémoire
    const interval = setInterval(() => {
      if (sentNotifications.current.size > 1000) {
        sentNotifications.current.clear();
        console.log('Réinitialisation du tracking des notifications (trop d\'entrées)');
      }
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Vérifier automatiquement les tâches en retard toutes les 5 minutes
  useEffect(() => {
    if (!state.cloudUser) return;

    const checkOverdueTasks = () => {
      const allTasks = state.projects.flatMap(p => p.tasks || []);
      const overdueTasks = allTasks.filter(task => {
        if (task.status === 'done' || task.status === 'non-suivi') return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dueDate < today;
      });

      // Envoyer des notifications pour les tâches en retard
      overdueTasks.forEach(task => {
        const notificationId = getNotificationId('overdue', task.id, task.dueDate);
        
        // Vérifier si déjà notifié AUJOURD'HUI
        const today = new Date().toDateString();
        const lastNotificationKey = `overdue-notified-${today}`;
        const lastNotified = localStorage.getItem(lastNotificationKey);
        const alreadyNotifiedToday = lastNotified?.split(',').includes(task.id);
        
        if (!alreadyNotifiedToday) {
          showTaskOverdue(task);
          markNotificationAsSent(notificationId);
          
          // Marquer cette tâche comme notifiée aujourd'hui
          const currentNotified = lastNotified ? `${lastNotified},${task.id}` : task.id;
          localStorage.setItem(lastNotificationKey, currentNotified);
        }
      });
    };

    // Vérifier immédiatement au chargement
    checkOverdueTasks();
    
    // Puis vérifier toutes les 5 minutes
    const interval = setInterval(checkOverdueTasks, 5 * 60 * 1000);
    
    // Nettoyer le localStorage au changement de jour (minuit)
    const cleanupDaily = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('overdue-notified-')) {
          localStorage.removeItem(key);
        }
      });
    };
    
    // Vérifier si on est passé à minuit pour nettoyer
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(cleanupDaily, msUntilMidnight);
    
    return () => {
      clearInterval(interval);
      clearTimeout(cleanupDaily);
    };
  }, [state.projects, state.cloudUser, showTaskOverdue]);

  return {
    // État
    isSupported: notificationService.getSupportStatus(),
    canShowNotifications: canShowNotifications(),
    isQuietHours: isQuietHours(),
    getActiveNotificationCount: () => notificationService.getActiveNotificationCount(),
    getRecentNotifications: () => notificationService.getRecentNotifications(),
    
    // Actions
    showNotification,
    showTaskReminder,
    showTaskOverdue,
    showTaskCompleted,
    showProjectMilestone,
    showCustomNotification,
    scheduleNotification,
    clearAllNotifications,
    
    // Utilitaires
    isProjectFollowed,
    shouldShowTaskNotification,
    
    // Service direct
    notificationService
  };
};

export default useNotifications;
