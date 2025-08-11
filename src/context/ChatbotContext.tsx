import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ChatbotSettings {
  isEnabled: boolean;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  // Ajoutez d'autres paramètres personnalisables ici
}

export interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  settings: ChatbotSettings;
  updateSettings: (newSettings: Partial<ChatbotSettings>) => void;
  resetSettings: () => void;
  // Ajoutez d'autres méthodes et états partagés ici
}

const defaultSettings: ChatbotSettings = {
  isEnabled: true,
  showNotifications: true,
  theme: 'system',
  language: 'fr',
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

// Vérifier si on est côté navigateur
const isBrowser = typeof window !== 'undefined';

export const ChatbotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings>(() => {
    // Charger les paramètres depuis le stockage local uniquement côté client
    if (isBrowser) {
      const savedSettings = localStorage.getItem('chatbotSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }
    return defaultSettings;
  });

  // Sauvegarder les paramètres dans le stockage local lorsqu'ils changent
  useEffect(() => {
    // Ne pas exécuter côté serveur
    if (!isBrowser) return;
    
    localStorage.setItem('chatbotSettings', JSON.stringify(settings));
    
    // Appliquer le thème
    if (settings.theme === 'dark' || 
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<ChatbotSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const contextValue: ChatbotContextType = {
    isOpen,
    setIsOpen,
    settings,
    updateSettings,
    resetSettings
  };

  return (
    <ChatbotContext.Provider value={contextValue}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

export default ChatbotContext;
