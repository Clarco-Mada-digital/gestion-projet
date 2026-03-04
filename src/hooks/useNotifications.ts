import { useCallback, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import PushNotificationService, { PushNotificationOptions } from '../services/notifications/pushNotificationService';
import { Task, Project, TaskStatus } from '../types';

export const useNotifications = () => {
  const { state } = useApp();
  const notificationService = PushNotificationService.getInstance();
  
  // Référence pour tracker les notifications déjà envoyées
  const sentNotifications = useRef<Set<string>>(new Set());

  const canShowNotifications = useCallback(() => {
    const settings = localStorage.getItem('notificationSettings');
    if (!settings) return false;
    
    const notificationSettings = JSON.parse(settings);
    return state.appSettings?.pushNotifications && notificationSettings;
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
      console.log('Notification bloquée : tâche non suivie');
      return false;
    }

    // Ne pas notifier si le projet n'est pas suivi
    if (!isProjectFollowed(task.projectId)) {
      console.log('Notification bloquée : projet non suivi');
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
      console.log('Notification de rappel déjà envoyée pour la tâche:', task.id);
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
      console.log('Notification de retard déjà envoyée pour la tâche:', task.id);
      return;
    }

    await notificationService.showTaskOverdue(task);
    markNotificationAsSent(notificationId);
  }, [canShowNotifications, isQuietHours, shouldShowTaskNotification, getNotificationId, wasNotificationSent, markNotificationAsSent]);

  const showTaskCompleted = useCallback(async (task: Task) => {
    if (!canShowNotifications() || isQuietHours()) return;
    
    if (!shouldShowTaskNotification(task)) return;

    const notificationId = getNotificationId('completed', task.id, task.updatedAt);
    if (wasNotificationSent(notificationId)) {
      console.log('Notification de complétion déjà envoyée pour la tâche:', task.id);
      return;
    }

    await notificationService.showTaskCompleted(task);
    markNotificationAsSent(notificationId);
  }, [canShowNotifications, isQuietHours, shouldShowTaskNotification, getNotificationId, wasNotificationSent, markNotificationAsSent]);

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
    
    await notificationService.scheduleNotification(options, delay);
  }, [canShowNotifications]);

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

  return {
    // État
    isSupported: notificationService.getSupportStatus(),
    canShowNotifications: canShowNotifications(),
    isQuietHours: isQuietHours(),
    
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
