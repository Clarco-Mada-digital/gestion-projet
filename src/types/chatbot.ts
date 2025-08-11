export interface ChatbotSettings {
  isEnabled: boolean;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface ChatbotMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  settings: ChatbotSettings;
  updateSettings: (settings: Partial<ChatbotSettings>) => void;
}
