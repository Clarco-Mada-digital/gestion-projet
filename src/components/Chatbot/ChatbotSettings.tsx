import React, { useState, useEffect } from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import type { ChatbotSettings } from '../../types/chatbot';

interface ChatbotSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const ChatbotSettings: React.FC<ChatbotSettingsProps> = ({ visible, onClose }) => {
  const { settings, updateSettings } = useChatbot();
  const [localSettings, setLocalSettings] = useState<ChatbotSettings>({
    isEnabled: settings.isEnabled,
    showNotifications: settings.showNotifications,
    theme: settings.theme,
    language: settings.language
  });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleChange = (key: keyof ChatbotSettings, value: boolean | string) => {
    setLocalSettings((prev: ChatbotSettings) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Paramètres de l'assistant IA</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Général</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="dark:text-gray-300">Activer l'assistant</span>
                <input
                  type="checkbox"
                  checked={localSettings.isEnabled}
                  onChange={(e) => handleChange('isEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="dark:text-gray-300">Afficher les notifications</span>
                <input
                  type="checkbox"
                  checked={localSettings.showNotifications}
                  onChange={(e) => handleChange('showNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Apparence</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Thème</label>
                <select
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={settings.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                >
                  <option value="system">Système</option>
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Langue</label>
                <select
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 dark:text-gray-200">À propos</h3>
            <div className="space-y-2">
              <p className="dark:text-gray-300">Version: 1.0.0</p>
              <p className="text-gray-500 dark:text-gray-400">Assistant IA pour la gestion de projet</p>
              <button 
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                onClick={() => {
                  if (window.confirm('Voulez-vous réinitialiser tous les paramètres par défaut ?')) {
                    updateSettings({
                      isEnabled: true,
                      showNotifications: true,
                      theme: 'system',
                      language: 'fr',
                    });
                  }
                }}
              >
                Réinitialiser les paramètres
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSettings;
