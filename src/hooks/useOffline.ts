import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import OfflineService, { OfflineData, SyncQueueItem } from '../services/offline/offlineService';
import { Project, Task } from '../types';

export interface OfflineStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastSyncTime: string | null;
  pendingSyncCount: number;
  offlineStats: {
    projectsCount: number;
    tasksCount: number;
    pendingSyncCount: number;
    lastSyncTime: string | null;
  };
}

export const useOffline = () => {
  const { state, dispatch } = useApp();
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOfflineMode: false,
    lastSyncTime: null,
    pendingSyncCount: 0,
    offlineStats: {
      projectsCount: 0,
      tasksCount: 0,
      pendingSyncCount: 0,
      lastSyncTime: null
    }
  });

  const offlineService = OfflineService.getInstance();

  // Vérifier le statut de connexion
  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setOfflineStatus(prev => ({
        ...prev,
        isOnline,
        isOfflineMode: !isOnline
      }));

      // Si nous revenons en ligne, essayer de synchroniser
      if (isOnline) {
        syncData();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Vérifier le statut initial
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Mettre à jour les statistiques hors-ligne
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await offlineService.getOfflineStats();
        const lastSync = await offlineService.getLastSyncTime();
        
        setOfflineStatus(prev => ({
          ...prev,
          offlineStats: stats,
          lastSyncTime: lastSync,
          pendingSyncCount: stats.pendingSyncCount
        }));
      } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques hors-ligne:', error);
      }
    };

    updateStats();
    
    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Sauvegarder un projet localement
  const saveProjectOffline = useCallback(async (project: Project) => {
    try {
      await offlineService.saveProject(project);
      
      // Mettre à jour les statistiques
      const stats = await offlineService.getOfflineStats();
      setOfflineStatus(prev => ({
        ...prev,
        offlineStats: stats
      }));
      
      console.log('Projet sauvegardé localement');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde locale du projet:', error);
    }
  }, []);

  // Sauvegarder une tâche localement
  const saveTaskOffline = useCallback(async (task: Task) => {
    try {
      await offlineService.saveTask(task);
      
      // Mettre à jour les statistiques
      const stats = await offlineService.getOfflineStats();
      setOfflineStatus(prev => ({
        ...prev,
        offlineStats: stats
      }));
      
      console.log('Tâche sauvegardée localement');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde locale de la tâche:', error);
    }
  }, []);

  // Synchroniser les données
  const syncData = useCallback(async () => {
    if (!offlineStatus.isOnline) {
      console.log('Hors-ligne : synchronisation impossible');
      return;
    }

    try {
      await offlineService.syncWithServer();
      
      // Mettre à jour les statistiques
      const stats = await offlineService.getOfflineStats();
      const lastSync = await offlineService.getLastSyncTime();
      
      setOfflineStatus(prev => ({
        ...prev,
        offlineStats: stats,
        lastSyncTime: lastSync,
        pendingSyncCount: stats.pendingSyncCount
      }));
      
      // Notifier l'utilisateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Synchronisation réussie', {
          body: 'Vos données ont été synchronisées avec le serveur',
          icon: '/favicon.ico',
          tag: 'sync-success'
        });
      }
      
      console.log('Synchronisation terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }, [offlineStatus.isOnline]);

  // Charger les données locales
  const loadOfflineData = useCallback(async () => {
    try {
      const data = await offlineService.exportData();
      
      // Mettre à jour le contexte avec les données locales
      if (data.projects.length > 0) {
        dispatch({
          type: 'SET_PROJECTS',
          payload: data.projects
        });
      }
      
      if (data.users.length > 0) {
        dispatch({
          type: 'SET_USERS',
          payload: data.users
        });
      }
      
      console.log('Données locales chargées:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement des données locales:', error);
      return null;
    }
  }, [dispatch]);

  // Exporter les données
  const exportOfflineData = useCallback(async (): Promise<OfflineData | null> => {
    try {
      const data = await offlineService.exportData();
      
      // Créer un blob et télécharger
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gestion-projet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Données exportées avec succès');
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
      return null;
    }
  }, []);

  // Importer des données
  const importOfflineData = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data: OfflineData = JSON.parse(text);
      
      await offlineService.importData(data);
      
      // Recharger les données dans le contexte
      await loadOfflineData();
      
      console.log('Données importées avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'importation des données:', error);
      return false;
    }
  }, [loadOfflineData]);

  // Vider toutes les données locales
  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      await offlineService.clearAllData();
      
      // Réinitialiser les statistiques
      setOfflineStatus(prev => ({
        ...prev,
        offlineStats: {
          projectsCount: 0,
          tasksCount: 0,
          pendingSyncCount: 0,
          lastSyncTime: null
        },
        lastSyncTime: null,
        pendingSyncCount: 0
      }));
      
      console.log('Données locales effacées');
    } catch (error) {
      console.error('Erreur lors de l\'effacement des données locales:', error);
    }
  }, []);

  // Forcer une synchronisation manuelle
  const forceSync = useCallback(async () => {
    if (!offlineStatus.isOnline) {
      alert('Vous devez être connecté pour synchroniser les données');
      return;
    }

    await syncData();
  }, [offlineStatus.isOnline, syncData]);

  // Obtenir le statut de synchronisation
  const getSyncStatus = useCallback(() => {
    if (!offlineStatus.isOnline) {
      return {
        status: 'offline',
        message: 'Hors-ligne',
        color: 'text-red-600'
      };
    }

    if (offlineStatus.pendingSyncCount > 0) {
      return {
        status: 'pending',
        message: `${offlineStatus.pendingSyncCount} modifications en attente`,
        color: 'text-yellow-600'
      };
    }

    if (offlineStatus.lastSyncTime) {
      const lastSync = new Date(offlineStatus.lastSyncTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
      
      if (diffMinutes < 5) {
        return {
          status: 'synced',
          message: 'Synchronisé',
          color: 'text-green-600'
        };
      } else {
        return {
          status: 'stale',
          message: `Dernière sync: ${diffMinutes} min`,
          color: 'text-gray-600'
        };
      }
    }

    return {
      status: 'unknown',
      message: 'Jamais synchronisé',
      color: 'text-gray-600'
    };
  }, [offlineStatus]);

  return {
    // État
    isOnline: offlineStatus.isOnline,
    isOfflineMode: offlineStatus.isOfflineMode,
    lastSyncTime: offlineStatus.lastSyncTime,
    pendingSyncCount: offlineStatus.pendingSyncCount,
    offlineStats: offlineStatus.offlineStats,
    
    // Actions
    saveProjectOffline,
    saveTaskOffline,
    syncData,
    loadOfflineData,
    exportOfflineData,
    importOfflineData,
    clearOfflineData,
    forceSync,
    
    // Utilitaires
    getSyncStatus,
    offlineService
  };
};

export default useOffline;
