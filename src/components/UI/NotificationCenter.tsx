import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Check, Trash2, ExternalLink, Reply } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationService } from '../../services/collaboration/notificationService';
import { activityService } from '../../services/collaboration/activityService';
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
  type?: string;
}

export function NotificationCenter() {
  const { state, dispatch } = useApp();
  const {
    isSupported,
    isQuietHours,
    clearAllNotifications: clearPWANotifications,
    deleteNotification: deletePWANotification,
    getRecentNotifications,
    showCustomNotification
  } = useNotifications();
  const [cloudNotifications, setCloudNotifications] = useState<Notification[]>([]);
  const [pwaNotifications, setPwaNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialiser Firebase Cloud Messaging
  const initializeFCM = async () => {
  // Éviter les initialisations multiples
  if ((window as any).fcmInitialized) return;
  (window as any).fcmInitialized = true;
    try {
      // Attendre que le Service Worker soit enregistré et actif
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        console.log('Service Worker prêt pour FCM');

        // Petite pause pour s'assurer que tout est stable
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const { default: FirebaseCloudMessaging } = await import('../../services/notifications/firebaseCloudMessaging');
      const fcm = FirebaseCloudMessaging.getInstance();
      
      if (fcm.isSupported()) {
        // Demander la permission et obtenir le token
        const token = await fcm.requestPermissionAndGetToken();
        if (token) {
          console.log('FCM initialisé avec succès');
          
          // Écouter les messages en avant-plan
          // IMPORTANT: on utilise showCustomNotification du composant courant, jamais réimporter le hook!
          fcm.onMessage(async (payload) => {
            console.log('Message FCM reçu en avant-plan:', payload);
            
            // Afficher une notification locale via la variable du composant déjà disponible
            showCustomNotification(
              payload.notification?.title || 'Notification',
              payload.notification?.body || 'Vous avez une nouvelle notification',
              {
                tag: `fcm-foreground-${payload.messageId || Date.now()}`,
                data: payload.data
              }
            );
          });
        }
      } else {
        console.log('FCM non supporté sur ce navigateur');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de FCM:', error);
      // Ne pas réessayer automatiquement pour éviter les boucles infinies
    }
  };

  // Ref pour suivre les notifications précédentes sans provoquer de re-render
  const previousNotificationsRef = useRef<NotificationType[]>([]);

  useEffect(() => {
    if (!state.cloudUser) return;

    console.log(`[NotificationCenter] Démarrage de l'écoute pour ${state.cloudUser.uid}`);

    const unsubscribe = notificationService.subscribeToNotifications(state.cloudUser.uid, (fetched: NotificationType[]) => {
      const previousNotifications = previousNotificationsRef.current;
      
      // Mettre à jour la ref AVANT le setState
      previousNotificationsRef.current = fetched;
      setCloudNotifications(fetched);
      
      // Détecter les nouvelles notifications (qui n'existaient pas avant)
      const newNotifications = fetched.filter(notification => 
        !previousNotifications.find(prev => prev.id === notification.id)
      );

      // Envoyer des notifications push pour les nouvelles notifications non lues
      // On vérifie directement la permission navigateur pour ne pas bloquer les mentions/cloud notifs
      const browserPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
      newNotifications.forEach(async notification => {
        if (!notification.isRead) {
          if (browserPermission === 'granted') {
            // Afficher via le service push directement (bypasse le check canShowNotifications qui peut bloquer)
            try {
              new Notification(notification.title, {
                body: notification.message,
                icon: fixPath('/icons/icon-192x192.png'),
                badge: fixPath('/icons/favicon-32x32.png'),
                tag: `firebase-${notification.id}`,
                data: {
                  type: 'firebase-notification',
                  notificationId: notification.id,
                  projectId: notification.projectId,
                  taskId: notification.taskId,
                  link: notification.link
                }
              });
            } catch (err) {
              // Fallback via le hook
              await showCustomNotification(
                notification.title,
                notification.message,
                {
                  tag: `firebase-${notification.id}`,
                  requireInteraction: false,
                  icon: fixPath('/icons/icon-192x192.png'),
                  badge: fixPath('/icons/favicon-32x32.png'),
                  data: {
                    type: 'firebase-notification',
                    notificationId: notification.id,
                    projectId: notification.projectId,
                    taskId: notification.taskId,
                    link: notification.link
                  }
                }
              );
            }
          } else {
            // Si pas de permission, juste logguer (la notif est quand même dans le centre)
            console.log(`[NotificationCenter] Notification reçue sans permission push: ${notification.title}`);
          }
        }
      });
    });
    return () => {
      console.log('[NotificationCenter] Arrêt de l\'écoute des notifications');
      unsubscribe?.();
    };
  }, [state.cloudUser?.uid]); // IMPORTANT: seulement l'UID, pas cloudNotifications!

  useEffect(() => {
    if (state.cloudUser) {
      // Ne lancer les initialisations externes que si nécessaire
      const hasFirebaseProjects = state.projects.some(p => p.source === 'firebase');
      if (hasFirebaseProjects) {
        initializeFCM();
      } else {
        console.log('Pas de projet Partagé, FCM non activé (economie de ressources)');
      }
    }
  }, [state.cloudUser, state.projects]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPwaNotifications(getRecentNotifications());
    }
  }, [isOpen, getRecentNotifications]);

  const areNotificationsEnabled = () => {
    return state.appSettings?.pushNotifications === true;
  };

  const getProjectSource = (projectId?: string) => {
    if (!projectId) return null;
    const p = state.projects.find(p => p.id === projectId);
    return p ? p.source : null;
  };

  const filteredPWANotifications = pwaNotifications.filter(n => {
    const source = getProjectSource(n.projectId);
    // Si c'est un projet partagé (firebase), on ignore la notification locale
    if (source === 'firebase') return false;
    return true;
  });

  const unreadCount = cloudNotifications.filter(n => !n.isRead).length + filteredPWANotifications.length;
  
  const unifiedNotifications = [
    ...cloudNotifications.map(n => ({
      id: n.id,
      source: 'cloud' as const,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      timestamp: new Date(n.createdAt).getTime() || 0,
      projectId: n.projectId,
      taskId: n.taskId,
      projectName: n.projectName,
      link: n.link,
      type: n.type,
      original: n
    })),
    ...filteredPWANotifications.map(n => ({
      id: n.id,
      source: 'local' as const,
      title: n.title,
      message: n.body,
      isRead: false,
      timestamp: n.timestamp || 0,
      projectId: n.projectId,
      taskId: n.taskId,
      projectName: n.projectName,
      link: n.link || n.data?.link,
      type: n.data?.type,
      original: n
    }))
  ];

  unifiedNotifications.sort((a, b) => b.timestamp - a.timestamp);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent, source: 'cloud' | 'local') => {
    e.stopPropagation();
    if (source === 'cloud') {
      try {
        await notificationService.markAsRead(id);
        setCloudNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu:', error);
      }
    } else {
      // Local notifications are "marked as read" by deleting them
      deletePWANotification(id);
      setPwaNotifications(getRecentNotifications());
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent, source: 'cloud' | 'local') => {
    e.stopPropagation();
    if (source === 'cloud') {
      await notificationService.deleteNotification(id);
      setCloudNotifications(prev => prev.filter(n => n.id !== id));
    } else {
      deletePWANotification(id);
      setPwaNotifications(getRecentNotifications());
    }
  };

  const handleMarkAllAsRead = async () => {
    if (state.cloudUser) {
      await notificationService.markAllAsRead(cloudNotifications as NotificationType[]);
      setCloudNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
    // Also clear PWA notifications to mark them as read
    clearPWANotifications();
    setPwaNotifications(getRecentNotifications());
  };

  const handleClearAll = async () => {
    if (state.cloudUser) {
      await notificationService.clearAllNotifications(state.cloudUser.uid, cloudNotifications as NotificationType[]);
      setCloudNotifications([]);
    }
    clearPWANotifications();
    setPwaNotifications(getRecentNotifications());
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      (window as any).notificationService?.markAsRead?.(n.id);
    }
    
    if (n.projectId) {
      const project = state.projects.find(p => p.id === n.projectId);
      if (project) {
        // Rediriger vers la vue projets si on n'y est pas
        if (state.currentView !== 'projects') {
          dispatch({ type: 'SET_VIEW', payload: 'projects' });
        }
        
        // Ouvrir spécifiquement la discussion si c'est une mention de projet
        if (n.type === 'project_mention') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openProjectFeed', { detail: project }));
          }, 100);
        } else if (n.taskId) {
          dispatch({
            type: 'NAVIGATE_TO_TASK',
            payload: { projectId: n.projectId!, taskId: n.taskId! }
          });
        }
        
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

  const handleSendReply = async (n: Notification) => {
    if (!replyMessage.trim() || !state.cloudUser || !n.projectId) return;

    setIsSendingReply(true);
    try {
      await activityService.logActivity({
        projectId: n.projectId,
        type: 'project_discussion',
        actorId: state.cloudUser.uid,
        actorName: state.cloudUser.displayName || state.cloudUser.email || 'Anonyme',
        actorAvatar: state.cloudUser.photoURL || undefined,
        details: replyMessage.trim()
      });

      // Marquer comme lu après avoir répondu
      await notificationService.markAsRead(n.id);
      setCloudNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
      
      setReplyingToId(null);
      setReplyMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envois de la réponse:', error);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Gérer les clics sur les notifications PWA
  const handlePWANotificationClick = (notification: any) => {
    console.log('🔔 Clic sur notification PWA locale:', notification);
    
    // 1. Navigation prioritaire via les données structurées
    if (notification.data) {
      const { projectId, taskId } = notification.data;
      if (projectId && taskId) {
        console.log('🚀 Navigation vers tâche:', taskId, 'dans projet:', projectId);
        dispatch({
          type: 'NAVIGATE_TO_TASK',
          payload: { projectId, taskId }
        });
        setIsOpen(false);
        return;
      }
    }

    // 2. Fallback vers le lien s'il existe
    if (notification.link) {
      window.location.href = fixPath(notification.link);
      setIsOpen(false);
      return;
    }
    
    // 3. Fallback générique si rien d'autre
    setIsOpen(false);
  };

  const handleUnifiedClick = (n: typeof unifiedNotifications[0]) => {
    if (n.source === 'cloud') {
      handleNotificationClick(n.original);
    } else {
      handlePWANotificationClick(n.original);
      // Delete PWA notification on click so it's marked as read
      deletePWANotification(n.id);
      setPwaNotifications(getRecentNotifications());
    }
  };

  const totalNotifications = unifiedNotifications.length;

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
                      setPwaNotifications(getRecentNotifications());
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
            {/* Unified Notifications list */}
            {(showAll ? unifiedNotifications : unifiedNotifications.slice(0, 5)).map((n) => (
              <div
                key={`${n.source}-${n.id}`}
                className={`p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors relative group ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                onClick={() => handleUnifiedClick(n)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-semibold truncate pr-12 cursor-pointer ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {n.source === 'local' && '🔔 '}{n.title}
                  </h4>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e, n.source)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Marquer comme lu"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(n.id, e, n.source)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm mb-2 cursor-pointer ${!n.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {n.message}
                </p>
                {n.projectName && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                    <span className="font-medium">Projet:</span>
                    <span className="truncate max-w-[150px]">{n.projectName}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  {n.link || n.projectId ? (
                    <button
                      onClick={() => handleUnifiedClick(n)}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir
                    </button>
                  ) : null}
                  
                  {/* Bouton Répondre: disponible pour toutes les notifications cloud liées à un projet */}
                  {n.source === 'cloud' && n.projectId && (
                    <button
                      onClick={() => {
                        setReplyingToId(replyingToId === n.id ? null : n.id);
                        setReplyMessage('');
                      }}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Reply className="w-3 h-3" />
                      Répondre
                    </button>
                  )}
                  {n.timestamp > 0 && (
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Zone de réponse rapide */}
                {replyingToId === n.id && n.source === 'cloud' && (
                  <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-200" onClick={e => e.stopPropagation()}>
                    <textarea
                      autoFocus
                      className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none dark:text-white"
                      placeholder="Votre réponse rapide..."
                      rows={2}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100 rounded"
                        disabled={isSendingReply}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleSendReply(n.original)}
                        className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        disabled={isSendingReply || !replyMessage.trim()}
                      >
                        {isSendingReply ? '...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {unifiedNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-6 h-6 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 italic mb-2">Aucune notification</p>
              </div>
            )}
          </div>

          {unifiedNotifications.length > 5 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAll ? 'Afficher moins' : `Voir toutes les notifications (${unifiedNotifications.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
