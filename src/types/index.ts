export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Date de complétion de la sous-tâche (définie uniquement quand la case est cochée)
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // À déprécier, utiliser startDate et endDate
  startDate: string; // Date de début de la tâche
  endDate: string;   // Date de fin de la tâche
  assignees: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Date de complétion de la tâche
  tags: string[];
  subTasks: SubTask[];
  notes?: string;
  estimatedHours?: number;
}

export interface ProjectAISettings {
  enabled: boolean;
  provider: 'openai' | 'openrouter' | null;
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
  openaiModel: string;
  openrouterModel: string;
  maxTokens: number;
  temperature: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  aiSettings?: ProjectAISettings;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Fonction utilitaire pour les jours de la semaine
export const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Fonction utilitaire pour obtenir le nom du jour en français
export const getDayName = (day: DayOfWeek): string => {
  const days = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };
  return days[day] || day;
};

export interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications?: boolean; // Rendre optionnel pour la rétrocompatibilité
  daysOff?: DayOfWeek[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: 'admin' | 'member' | 'viewer';
  status?: 'active' | 'inactive';
  lastActive?: string;
  settings?: UserSettings;
  isPrimary?: boolean;
  cannotDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'today' | 'projects' | 'kanban' | 'calendar' | 'settings' | 'reports';

// Types pour Redux
export interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export interface SettingsState {
  email: {
    serviceId: string;
    templateId: string;
    publicKey: string;
    toEmail: string;
  };
  theme: 'light' | 'dark';
  language: string;
  isInitialized: boolean;
}

export interface RootState {
  projects: ProjectsState;
  settings: SettingsState;
}

export interface EmailSettings {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

export interface AISettings {
  provider: 'openai' | 'openrouter' | null;
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
  openrouterModel: string;
  openaiModel: string;
  maxTokens: number;
  temperature: number;
  isConfigured: boolean;
  lastTested: string | null;
  lastTestStatus: 'success' | 'error' | null;
  lastTestMessage: string | null;
}

// Configuration pour utiliser des modèles gratuits
export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'openrouter',  // OpenRouter propose des modèles gratuits
  openaiApiKey: null,
  openrouterApiKey: null,  // Pas de clé par défaut pour forcer l'utilisation du mode anonyme
  openrouterModel: 'google/gemma-7b-it:free',  // Modèle gratuit spécifique
  openaiModel: 'gpt-3.5-turbo',
  maxTokens: 500,  // Réduit pour économiser les crédits
  temperature: 0.5,  // Réponse plus prévisible
  isConfigured: true,
  lastTested: null,
  lastTestStatus: null,
  lastTestMessage: null,
};

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: Theme;
  fontSize: FontSize;
  defaultView: ViewMode;
  itemsPerPage: number;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  aiSettings: AISettings;
  contacts: Contact[];
}

export type Theme = 'light' | 'dark';

export type FontSize = 'small' | 'medium' | 'large';