import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Trash2 } from 'lucide-react';
import { Notification } from '../../types';
import { notificationService } from '../../services/collaboration/notificationService';
import { useApp } from '../../context/AppContext';

export function NotificationCenter() {
  const { state, dispatch } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
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
    if (!n.link) return;

    // Marquer comme lu
    if (!n.isRead) {
      notificationService.markAsRead(n.id);
    }

    // Parser le lien
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
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-[480px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
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
                  <div className="flex items-center gap-1">
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="p-1 rounded-md text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{n.message}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                  {n.link && (
                    <button
                      onClick={() => handleNotificationClick(n)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline font-medium"
                    >
                      Voir <ExternalLink className="w-2 h-2" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {notifications.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
              >
                {showAll ? 'Voir moins' : `Voir tout (${notifications.length})`}
              </button>
            )}
            {notifications.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 italic">Aucune notification</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
