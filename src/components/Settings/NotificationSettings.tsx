import { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Clock, Settings, Smartphone, Monitor } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

interface NotificationSettings {
  taskReminders: boolean;
  taskOverdue: boolean;
  taskCompleted: boolean;
  projectMilestones: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  firebasePushEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function NotificationSettings() {
  const { state, dispatch } = useApp();
  const { isSupported, notificationService } = useNotifications();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    taskReminders: true,
    taskOverdue: true,
    taskCompleted: true,
    projectMilestones: true,
    dailyDigest: false,
    weeklyDigest: false,
    soundEnabled: true,
    vibrationEnabled: true,
    firebasePushEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // État combiné pour savoir si les notifications sont vraiment actives
  const areNotificationsActive = settings.taskReminders || settings.taskOverdue || settings.taskCompleted || settings.projectMilestones;

  useEffect(() => {
    checkPermissionStatus();
    loadSettings();
  }, []);

  const checkPermissionStatus = async () => {
    const status = await notificationService.getPermissionStatus();
    setPermissionGranted(status.granted);
    
    // Mettre à jour le contexte avec l'état réel des permissions
    dispatch({
      type: 'UPDATE_USER_SETTINGS',
      payload: {
        ...state.appSettings,
        pushNotifications: status.granted
      }
    });
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      
      // Synchroniser avec l'état global
      dispatch({
        type: 'UPDATE_USER_SETTINGS',
        payload: {
          ...state.users[0]?.settings,
          pushNotifications: parsed.taskReminders || parsed.taskOverdue || parsed.taskCompleted || parsed.projectMilestones
        }
      });
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    
    const isAnyNotificationEnabled = newSettings.taskReminders || newSettings.taskOverdue || newSettings.taskCompleted || newSettings.projectMilestones;
    
    // Mettre à jour les paramètres utilisateur dans le contexte
    dispatch({
      type: 'UPDATE_USER_SETTINGS',
      payload: {
        ...state.users[0]?.settings,
        pushNotifications: isAnyNotificationEnabled
      }
    });
    
    // Mettre à jour aussi appSettings pour le NotificationCenter
    dispatch({
      type: 'UPDATE_APP_SETTINGS',
      payload: {
        ...state.appSettings,
        pushNotifications: isAnyNotificationEnabled
      }
    });
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionGranted(granted);
    
    if (granted) {
      // Activer les types de notifications par défaut
      const enabledSettings = {
        ...settings,
        taskReminders: true,
        taskOverdue: true,
        taskCompleted: true,
        projectMilestones: true
      };
      
      // Sauvegarder dans localStorage
      saveSettings(enabledSettings);
      
      // Mettre à jour les deux états
      dispatch({
        type: 'UPDATE_USER_SETTINGS',
        payload: {
          ...state.users[0]?.settings,
          pushNotifications: true
        }
      });
      
      dispatch({
        type: 'UPDATE_APP_SETTINGS',
        payload: {
          ...state.appSettings,
          pushNotifications: true
        }
      });
      
      // Afficher une notification de test
      await notificationService.showNotification({
        title: '🎉 Notifications activées!',
        body: 'Les notifications sont maintenant activées pour cette application.',
        icon: '/favicon.ico',
        tag: 'welcome-notification',
        requireInteraction: false,
        vibrate: [100, 50, 100]
      });
    }
  };

  const handleDisableNotifications = async () => {
    const success = await notificationService.unsubscribe();
    if (success) {
      setPermissionGranted(false);
      
      // Désactiver tous les types de notifications
      const disabledSettings = {
        ...settings,
        taskReminders: false,
        taskOverdue: false,
        taskCompleted: false,
        projectMilestones: false
      };
      
      // Sauvegarder dans localStorage
      saveSettings(disabledSettings);
      
      // Mettre à jour les deux états
      dispatch({
        type: 'UPDATE_USER_SETTINGS',
        payload: {
          ...state.users[0]?.settings,
          pushNotifications: false
        }
      });
      
      dispatch({
        type: 'UPDATE_APP_SETTINGS',
        payload: {
          ...state.appSettings,
          pushNotifications: false
        }
      });
    }
  };

  const sendTestNotification = async () => {
    if (!permissionGranted) return;
    
    // Tester les notifications locales
    await notificationService.showNotification({
      title: '🔔 Notification de test',
      body: 'Ceci est une notification de test pour vérifier que tout fonctionne correctement!',
      icon: '/favicon.ico',
      tag: 'test-notification',
      requireInteraction: false,
      vibrate: settings.vibrationEnabled ? [200, 100, 200] : undefined,
      data: { type: 'test' }
    });
    
    // Tester les notifications Firebase si activées
    if (settings.firebasePushEnabled) {
      try {
        const { default: FirebaseCloudMessaging } = await import('../../services/notifications/firebaseCloudMessaging');
        const fcm = FirebaseCloudMessaging.getInstance();
        await fcm.sendTestNotification();
      } catch (error) {
        console.error('Erreur lors du test des notifications Firebase:', error);
      }
    }
    
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    saveSettings({
      ...settings,
      [key]: value
    });
  };

  const updateQuietHours = (enabled: boolean, start?: string, end?: string) => {
    saveSettings({
      ...settings,
      quietHours: {
        enabled,
        start: start || settings.quietHours.start,
        end: end || settings.quietHours.end
      }
    });
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <BellOff className="w-5 h-5" />
          <div>
            <h3 className="font-medium">Notifications non supportées</h3>
            <p className="text-sm mt-1">
              Votre navigateur ne supporte pas les notifications push. Veuillez utiliser un navigateur moderne comme Chrome, Firefox, ou Edge.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut des notifications */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${areNotificationsActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
              {areNotificationsActive ? (
                <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notifications push
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {areNotificationsActive ? 'Activées les notifications' : 'Désactivées'}
              </p>
            </div>
          </div>
          
          {!permissionGranted ? (
            <Button onClick={requestPermission}>
              Activer les notifications
            </Button>
          ) : !areNotificationsActive ? (
            <Button onClick={() => {
              // Activer les types de notifications par défaut
              const enabledSettings = {
                ...settings,
                taskReminders: true,
                taskOverdue: true,
                taskCompleted: true,
                projectMilestones: true
              };
              saveSettings(enabledSettings);
            }}>
              Activer les notifications
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={sendTestNotification}
                disabled={testNotificationSent}
              >
                {testNotificationSent ? 'Envoyée!' : 'Tester'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDisableNotifications}
              >
                Désactiver
              </Button>
            </div>
          )}
        </div>

        {permissionGranted && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p>
              💡 Les notifications vous aideront à ne jamais oublier une tâche importante. 
              Vous recevrez des rappels pour les tâches dues aujourd'hui et les tâches en retard.
            </p>
          </div>
        )}
      </Card>

      {/* Types de notifications */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Types de notifications
        </h3>
        
        <div className="space-y-3">
          {[
            { 
              key: 'taskReminders' as keyof NotificationSettings, 
              label: 'Rappels de tâches', 
              description: 'Recevoir un rappel lorsque une tâche est due aujourd\'hui',
              icon: <Clock className="w-4 h-4" />
            },
            { 
              key: 'taskOverdue' as keyof NotificationSettings, 
              label: 'Tâches en retard', 
              description: 'Être notifié lorsqu\'une tâche est en retard',
              icon: <Bell className="w-4 h-4" />
            },
            { 
              key: 'taskCompleted' as keyof NotificationSettings, 
              label: 'Tâches terminées', 
              description: 'Être notifié lorsqu\'une tâche est marquée comme terminée',
              icon: <Bell className="w-4 h-4" />
            },
            { 
              key: 'projectMilestones' as keyof NotificationSettings, 
              label: 'Jalons de projet', 
              description: 'Recevoir des notifications pour les jalons importants des projets',
              icon: <Monitor className="w-4 h-4" />
            },
            { 
              key: 'firebasePushEnabled' as keyof NotificationSettings, 
              label: 'Notifications Cloud (Firebase)', 
              description: 'Recevoir des notifications même quand l\'application est fermée',
              icon: <Smartphone className="w-4 h-4" />
            }
          ].map(({ key, label, description, icon }) => (
            <div key={key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-gray-600 dark:text-gray-400">
                  {icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Préférences de notification */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Préférences de notification
        </h3>
        
        <div className="space-y-4">
          {/* Son */}
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-gray-600 dark:text-gray-400">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Son</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Activer le son pour les notifications
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-gray-600 dark:text-gray-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Vibration</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Activer la vibration pour les notifications (mobile)
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => updateSetting('vibrationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Heures de silence */}
      <Card className="p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Heures de silence
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Activer les heures de silence</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ne pas recevoir de notifications pendant certaines heures
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quietHours.enabled}
                onChange={(e) => updateQuietHours(e.target.checked, settings.quietHours.start, settings.quietHours.end)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.quietHours.enabled && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">De:</label>
              <input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => updateQuietHours(true, e.target.value, settings.quietHours.end)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">À:</label>
              <input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => updateQuietHours(true, settings.quietHours.start, e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default NotificationSettings;
