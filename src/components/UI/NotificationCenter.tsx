import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Check, Trash2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationService } from '../../services/collaboration/notificationService';
import { fixPath } from '../../lib/pathUtils';
import { Notification as NotificationType } from '../../types';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  projectId?: string;
  taskId?: string;
  projectName?: string;
  link?: string;
}

export function NotificationCenter() {
  const { state, dispatch } = useApp();
  const {
    isSupported,
    isQuietHours,
    clearAllNotifications: clearPWANotifications,
    getRecentNotifications
  } = useNotifications();
  const [cloudNotifications, setCloudNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.cloudUser) return;

    const unsubscribe = notificationService.subscribeToNotifications(state.cloudUser.uid, (fetched: NotificationType[]) => {
      setCloudNotifications(fetched);
    });
    return () => unsubscribe?.();
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

  const areNotificationsEnabled = () => {
    return state.appSettings?.pushNotifications === true;
  };

  const unreadCount = cloudNotifications.filter(n => !n.isRead).length;
  const pwaNotifications = getRecentNotifications();

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔔 Tentative de marquage comme lu:', id);

    try {
      await notificationService.markAsRead(id);
      console.log('✅ Notification marquée comme lue côté serveur');

      // Mettre à jour l'état local pour rafraîchir l'interface
      setCloudNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
        console.log('🔄 État local mis à jour:', updated.find(n => n.id === id)?.isRead);
        return updated;
      });
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
    // Mettre à jour l'état local pour rafraîchir l'interface
    setCloudNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllAsRead = async () => {
    if (!state.cloudUser) return;
    await notificationService.markAllAsRead(cloudNotifications as NotificationType[]);
    // Mettre à jour l'état local pour rafraîchir l'interface
    setCloudNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = async () => {
    if (!state.cloudUser) return;
    await notificationService.clearAllNotifications(state.cloudUser.uid, cloudNotifications as NotificationType[]);
    // Mettre à jour l'état local pour rafraîchir l'interface
    setCloudNotifications([]);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      (window as any).notificationService?.markAsRead?.(n.id);
    }
    
    if (n.projectId) {
      const projectExists = state.projects.some(p => p.id === n.projectId);
      if (projectExists) {
        dispatch({
          type: 'NAVIGATE_TO_TASK',
          payload: { projectId: n.projectId!, taskId: n.taskId! }
        });
        setIsOpen(false);
        return;
      } else {
        console.warn('Projet non trouvé pour la notification:', n.projectId);
        dispatch({ type: 'SET_VIEW', payload: 'projects' });
        setIsOpen(false);
        return;
      }
    }

    if (n.link) {
      window.location.href = fixPath(n.link);
    }
  };

  // Gérer les clics sur les notifications PWA
  const handlePWANotificationClick = (notification: any) => {
    if (notification.data) {
      const { projectId, taskId, type: _type } = notification.data;
      if (projectId && taskId) {
        // Construire le bon lien pour GitHub Pages
        const taskUrl = `${fixPath(`/projects/${projectId}`)}?task=${taskId}`;
        window.location.href = taskUrl;
      } else if (projectId) {
        // Lien vers le projet seulement
        window.location.href = fixPath(`/projects/${projectId}`);
      }
    }
    // Marquer comme vue après navigation
    setTimeout(() => clearPWANotifications(), 100);
  };

  const totalNotifications = cloudNotifications.length + pwaNotifications.length;

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
                  <button
                    onClick={() => {
                      clearPWANotifications();
                      setShowSettings(false);
                    }}
                    className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Effacer notifications locales
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 px-2 pt-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline border border-blue-500 rounded-lg px-2 py-1"
              >
                Tout lire
              </button>
            )}
            {totalNotifications > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-red-500 hover:underline border border-red-500 rounded-lg px-2 py-1"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Notifications Cloud */}
            {(showAll ? cloudNotifications : cloudNotifications.slice(0, 5)).map((n) => (
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

            {/* Notifications PWA récentes */}
            {pwaNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  🔔 Notifications locales ({pwaNotifications.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pwaNotifications.map((notification, _index) => (
                    <div
                      key={notification.id}
                      onClick={() => handlePWANotificationClick(notification)}
                      className="p-2 border border border-gray-100 dark:border-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {notification.title}
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          {notification.projectName && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              📁 {notification.projectName}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Marquer la notification PWA spécifique comme lue (simulation)
                              console.log('🔔 Notification PWA marquée comme lue:', notification.id);
                              // Pour l'instant, on la supprime car l'API ne permet pas de marquer comme lue
                              // TODO: Implémenter une vraie API pour marquer comme lue
                              clearPWANotifications();
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Marquer comme vue"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearPWANotifications();
                            }}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cloudNotifications.length === 0 && pwaNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-6 h-6 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 italic mb-2">Aucune notification</p>
                <p className="text-xs text-gray-400 text-center px-4">
                  💡 Les notifications locales (PWA) apparaissent directement dans votre navigateur 
                  et sont maintenant listées ici avec les notifications cloud.
                </p>
              </div>
            )}
          </div>

          {cloudNotifications.length > 5 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAll ? 'Afficher moins' : `Voir toutes les notifications (${cloudNotifications.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
