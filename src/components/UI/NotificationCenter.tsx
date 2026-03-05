import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Trash2, Settings, X } from 'lucide-react';
import { Notification } from '../../types';
import { notificationService } from '../../services/collaboration/notificationService';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from './Button';

export function NotificationCenter() {
  const { state, dispatch } = useApp();
  const { 
    isSupported, 
    canShowNotifications, 
    isQuietHours,
    clearAllNotifications: clearPWANotifications 
  } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.cloudUser) return;

    const unsubscribe = notificationService.subscribeToNotifications(state.cloudUser.uid, (fetched) => {
      setNotifications(fetched);
    });
    return () => unsubscribe();
  }, [state.cloudUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Vérifier si les notifications sont activées (plus simple et direct)
  const areNotificationsEnabled = () => {
    return state.appSettings?.pushNotifications === true;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.length > 0) {
      await notificationService.markAllAsRead(notifications);
    }
  };

  const handleClearAll = async () => {
    if (state.cloudUser && notifications.length > 0) {
      if (window.confirm('Voulez-vous supprimer toutes vos notifications ?')) {
        await notificationService.clearAllNotifications(state.cloudUser.uid, notifications);
      }
    }
  };

  const handleNotificationClick = (n: Notification) => {
    // Marquer comme lu
    if (!n.isRead) {
      notificationService.markAsRead(n.id);
    }

    // Utiliser les données directes de la notification si disponibles
    if (n.projectId && n.taskId) {
      dispatch({
        type: 'NAVIGATE_TO_TASK',
        payload: { projectId: n.projectId, taskId: n.taskId }
      });
      setIsOpen(false);
      return;
    }

    if (n.projectId) {
      dispatch({ type: 'SET_SELECTED_PROJECT', payload: n.projectId });
      dispatch({ type: 'SET_VIEW', payload: 'projects' });
      setIsOpen(false);
      return;
    }

    // Parser le lien seulement si les données directes ne sont pas disponibles
    if (!n.link) return;

    try {
      const link = n.link.startsWith('/') ? `${window.location.origin}${n.link}` : n.link;
      const url = new URL(link);
      const pathParts = url.pathname.split('/');

      // Format 1: /projects/:projectId?task=:taskId
      // Format 2: /projects/:projectId/tasks/:taskId
      const projectIndex = pathParts.indexOf('projects');
      const projectId = projectIndex !== -1 ? pathParts[projectIndex + 1] : null;

      let taskId = url.searchParams.get('task');
      if (!taskId && projectIndex !== -1 && pathParts[projectIndex + 2] === 'tasks') {
        taskId = pathParts[projectIndex + 3];
      }

      if (projectId && taskId) {
        dispatch({
          type: 'NAVIGATE_TO_TASK',
          payload: { projectId, taskId }
        });
        setIsOpen(false);
      } else if (projectId) {
        dispatch({ type: 'SET_SELECTED_PROJECT', payload: projectId });
        dispatch({ type: 'SET_VIEW', payload: 'projects' });
        setIsOpen(false);
      } else {
        // Fallback pour les liens simples
        window.location.href = n.link;
      }
    } catch (e) {
      console.error("Erreur lors de la navigation depuis notification:", e);
      window.location.href = n.link;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          !isSupported 
            ? 'text-gray-400 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' 
            : isQuietHours
              ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title={
          !isSupported 
            ? 'Notifications non supportées' 
            : isQuietHours 
              ? 'Mode silence activé' 
              : 'Notifications'
        }
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isSupported && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-[480px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Paramètres des notifications"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Paramètres des notifications */}
          {showSettings && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Support navigateur</span>
                  <span className={`text-sm font-medium ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                    {isSupported ? '✓ Oui' : '✗ Non'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Notifications activées</span>
                  <span className={`text-sm font-medium ${areNotificationsEnabled() ? 'text-green-600' : 'text-red-600'}`}>
                    {areNotificationsEnabled() ? '✓ Oui' : '✗ Non'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mode silence</span>
                  <span className={`text-sm font-medium ${isQuietHours ? 'text-yellow-600' : 'text-green-600'}`}>
                    {isQuietHours ? '✓ Activé' : '✗ Désactivé'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => {
                      clearPWANotifications();
                      setShowSettings(false);
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Effacer notifications locales
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Tout lire
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-red-500 hover:underline"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {(showAll ? notifications : notifications.slice(0, 5)).map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors relative group ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-semibold truncate pr-12 ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {n.title}
                  </h4>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Marquer comme lu"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm mb-2 ${!n.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {n.message}
                </p>
                {n.projectName && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="font-medium">Projet:</span>
                    <span>{n.projectName}</span>
                  </div>
                )}
                {n.link && (
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir
                  </button>
                )}
              </div>
            ))}
          </div>

          {notifications.length > 5 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAll ? 'Afficher moins' : `Voir toutes les notifications (${notifications.length})`}
              </button>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="w-6 h-6 text-gray-300" />
              <p className="text-sm text-gray-500 italic">Aucune notification</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
