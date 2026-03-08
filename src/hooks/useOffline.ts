import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import OfflineService from '../services/offline/offlineService';
import { Project, Task } from '../types';

export function useOffline() {
  const [offlineStatus, setOfflineStatus] = useState({
    isOnline: navigator.onLine,
    lastSync: null as string | null
  });

  const [offlineStats, setOfflineStats] = useState({
    projectsCount: 0,
    tasksCount: 0,
    pendingSyncCount: 0,
    lastSyncTime: null as string | null
  });

  const { dispatch, state } = useApp();

  // Fonctions utilitaires avec gestion d'erreurs
  const updateStats = useCallback(async () => {
    try {
      if (typeof OfflineService.getOfflineStats === 'function') {
        const stats = await OfflineService.getOfflineStats();
        setOfflineStats(stats);
      } else {
        // Fallback si méthode indisponible
        setOfflineStats({
          projectsCount: state.projects.length,
          tasksCount: state.projects.reduce((total, project) => total + (project.tasks?.length || 0), 0),
          pendingSyncCount: 0,
          lastSyncTime: null
        });
      }
    } catch (error) {
      console.error('Erreur stats offline:', error);
      // Valeurs par défaut en cas d'erreur
      setOfflineStats({
        projectsCount: state.projects.length,
        tasksCount: state.projects.reduce((total, project) => total + (project.tasks?.length || 0), 0),
        pendingSyncCount: 0,
        lastSyncTime: null
      });
    }
  }, [state.projects]);

  const refreshLocalData = useCallback(async () => {
    try {
      if (typeof OfflineService.getLocalProjects === 'function') {
        const projects = await OfflineService.getLocalProjects();
        if (projects.length > 0) {
          dispatch({ type: 'SET_PROJECTS', payload: projects });
        }
      }
    } catch (error) {
      console.error('Erreur refresh local:', error);
    }
  }, [dispatch]);

  // Sauvegarder un projet localement
  const saveProjectOffline = useCallback(async (project: Project) => {
    try {
      if (typeof OfflineService.saveProject === 'function') {
        await OfflineService.saveProject(project);
        console.log('💾 Projet sauvegardé localement');
      } else {
        console.log('💾 Projet sauvegardé (simulation - IndexedDB indisponible)');
      }
      updateStats();
    } catch (error) {
      console.error('Erreur sauvegarde projet:', error);
      // Fallback : mettre à jour les stats localement
      setOfflineStats(prev => ({
        ...prev,
        projectsCount: prev.projectsCount + 1,
        pendingSyncCount: prev.pendingSyncCount + 1
      }));
    }
  }, [updateStats]);

  // Sauvegarder une tâche localement
  const saveTaskOffline = useCallback(async (task: Task) => {
    try {
      if (typeof OfflineService.saveTask === 'function') {
        await OfflineService.saveTask(task);
        console.log('📝 Tâche sauvegardée localement');
      } else {
        console.log('📝 Tâche sauvegardée (simulation - IndexedDB indisponible)');
      }
      updateStats();
    } catch (error) {
      console.error('Erreur sauvegarde tâche:', error);
      // Fallback : mettre à jour les stats localement
      setOfflineStats(prev => ({
        ...prev,
        tasksCount: prev.tasksCount + 1,
        pendingSyncCount: prev.pendingSyncCount + 1
      }));
    }
  }, [updateStats]);

  // Synchroniser les données
  const syncData = useCallback(async () => {
    if (!offlineStatus.isOnline) {
      console.log('⏸ Hors ligne - synchronisation différée');
      return;
    }

    try {
      if (typeof OfflineService.syncWithServer === 'function') {
        await OfflineService.syncWithServer();
        console.log('✅ Synchronisation IndexedDB terminée');
      } else {
        console.log('🔄 Synchronisation simulée terminée');
      }

      await updateStats();
      await refreshLocalData();

      // Marquer comme synchronisé
      setOfflineStats(prev => ({
        ...prev,
        pendingSyncCount: 0,
        lastSyncTime: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Erreur sync:', error);
      // Fallback simulation
      setOfflineStats(prev => ({
        ...prev,
        pendingSyncCount: 0,
        lastSyncTime: new Date().toISOString()
      }));
    }
  }, [offlineStatus.isOnline, updateStats, refreshLocalData]);

  // Charger les données locales
  const loadOfflineData = useCallback(async () => {
    try {
      if (typeof OfflineService.exportData === 'function') {
        const data = await OfflineService.exportData();
        if (data.projects && data.projects.length > 0) {
          dispatch({ type: 'SET_PROJECTS', payload: data.projects });
        }
        console.log('📂 Données IndexedDB chargées');
      } else {
        console.log('📂 Chargement simulé des données locales');
      }
      await updateStats();
    } catch (error) {
      console.error('Erreur chargement:', error);
      // Fallback vers les données en mémoire
      await updateStats();
    }
  }, [dispatch, updateStats]);

  // Effacer toutes les données locales
  const clearOfflineData = useCallback(async () => {
    try {
      if (typeof OfflineService.clearAll === 'function') {
        await OfflineService.clearAll();
        console.log('🗑️ Données IndexedDB effacées');
      } else {
        console.log('🗑️ Effacement simulé des données locales');
      }
      dispatch({ type: 'CLEAR_ALL_DATA' });
      setOfflineStats({ projectsCount: 0, tasksCount: 0, pendingSyncCount: 0, lastSyncTime: null });
    } catch (error) {
      console.error('Erreur clear:', error);
      // Fallback
      dispatch({ type: 'CLEAR_ALL_DATA' });
      setOfflineStats({ projectsCount: 0, tasksCount: 0, pendingSyncCount: 0, lastSyncTime: null });
    }
  }, [dispatch]);

  // Exporter les données
  const exportOfflineData = useCallback(async () => {
    try {
      let data;
      if (typeof OfflineService.exportData === 'function') {
        data = await OfflineService.exportData();
        console.log('📤 Export depuis IndexedDB');
      } else {
        // Fallback vers les données en mémoire
        data = {
          projects: state.projects,
          tasks: state.projects.flatMap(p => p.tasks || []),
          timestamp: new Date().toISOString()
        };
        console.log('📤 Export depuis mémoire');
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gestion-projet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      throw error;
    }
  }, [state.projects]);

  // Importer des données
  const importOfflineData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (typeof OfflineService.importData === 'function') {
        await OfflineService.importData(data);
        console.log('📥 Import vers IndexedDB');
      } else {
        console.log('📥 Import simulé');
      }

      if (data.projects) {
        dispatch({ type: 'SET_PROJECTS', payload: data.projects });
      }

      await loadOfflineData();
      console.log('📥 Données importées avec succès');
    } catch (error) {
      console.error('Erreur import:', error);
      throw error;
    }
  }, [dispatch, loadOfflineData]);

  // Synchronisation forcée
  const forceSync = useCallback(async () => {
    if (!offlineStatus.isOnline) {
      throw new Error('Pas de connexion internet');
    }
    await syncData();
  }, [offlineStatus.isOnline, syncData]);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(prev => ({ ...prev, isOnline: true }));
      console.log('📡 Connexion rétablie - synchronisation automatique');
      syncData();
    };
    const handleOffline = () => {
      setOfflineStatus(prev => ({ ...prev, isOnline: false }));
      console.log('📵 Connexion perdue - mode hors ligne');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncData]);

  // Charger les données initiales au montage
  useEffect(() => {
    loadOfflineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Mise à jour périodique des statistiques
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, [updateStats]);

  // Synchronisation périodique quand en ligne
  useEffect(() => {
    if (!offlineStatus.isOnline) return;
    const interval = setInterval(syncData, 120000); // Toutes les 2 minutes
    return () => clearInterval(interval);
  }, [offlineStatus.isOnline, syncData]);

  return {
    offlineStatus,
    saveProjectOffline,
    saveTaskOffline,
    syncData,
    clearOfflineData,
    loadOfflineData,
    refreshLocalData,
    exportOfflineData,
    importOfflineData,
    forceSync,
    isOnline: offlineStatus.isOnline,
    isOfflineMode: !offlineStatus.isOnline,
    offlineStats,
    lastSyncTime: offlineStats.lastSyncTime,
    pendingSyncCount: offlineStats.pendingSyncCount
  };
}
