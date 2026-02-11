export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // Date de complétion de la sous-tâche (définie uniquement quand la case est cochée)
  notes?: string;
  group?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'other';
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  dueDate: string;
  assignees: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  tags: string[];
  subTasks: SubTask[];
  notes?: string;
  estimatedHours?: number;
  endDate?: string; // Ajouté pour compatibilité avec ProjectsView
  attachments?: Attachment[]; // Fichiers joints (images, documents, etc.)
}

// Fonction utilitaire pour créer une tâche par défaut
export function createDefaultTask(): Task {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: '',
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    startDate: today,
    dueDate: today,
    assignees: [],
    projectId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    subTasks: [],
    notes: '',
    estimatedHours: 0,
    endDate: today
  };
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
  isConfigured?: boolean;
  lastTested?: string | null;
  lastTestStatus?: 'success' | 'error' | null;
  lastTestMessage?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'completed' | 'archived' | 'on-hold';
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  aiSettings?: ProjectAISettings;
  estimatedDuration?: number; // Ajouté pour compatibilité avec ProjectsView
  coverImage?: string | null; // URL de l'image de couverture
  coverImagePublicId?: string | null; // ID Public Cloudinary pour suivi/suppression

  // Champs pour la synchronisation Cloud (Firebase)
  source?: 'local' | 'firebase';
  ownerId?: string;
  members?: string[]; // Liste des IDs des utilisateurs ayant accès
  memberRoles?: Record<string, 'admin' | 'member' | 'viewer'>; // Rôles par utilisateur
  isShared?: boolean;
  lastSyncedAt?: string;
  kanbanSettings?: {
    columnOrder: string[];
    taskOrder?: Record<string, string[]>;
    customColumns: {
      id: string;
      title: string;
      gradient: string;
      iconColor: string;
    }[];
  };
  accentColor?: string;
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
  accentColor?: string;
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
  // Champs fusionnés pour plus de facilité d'accès
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  daysOff?: DayOfWeek[];
  photoURL?: string; // Pour compatibilité Firebase
  apiKey?: string;
}

export type TeamMember = User;

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
  kanbanSettings?: {
    columnOrder: string[];
    taskOrder?: Record<string, string[]>;
    customColumns: {
      id: string;
      title: string;
      gradient: string;
      iconColor: string;
    }[];
  };
  accentColor?: string;
  brandingSettings?: {
    companyName?: string;
    logo?: string;
    primaryColor: string;
    welcomeMessage?: string;
    sidebarTheme: 'light' | 'dark' | 'glass';
  };
}

export type Theme = 'light' | 'dark';

export type FontSize = 'small' | 'medium' | 'large';
export interface ReportEntry {
  id: string;
  title: string;
  content: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  projectIds: string[];
  type: 'standard' | 'ai';
  metadata?: {
    emailSent?: boolean;
    lastSentTo?: string[];
    emailSubject?: string;
    messageId?: string;
  };
}

export interface Comment {
  id: string;
  taskId: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mentions: string[]; // Liste des IDs des utilisateurs mentionnés
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_archived'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'comment_added'
  | 'member_added';

export interface Activity {
  id: string;
  projectId: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  targetId?: string; // ID de la tâche, du commentaire, etc.
  targetName?: string; // Nom de la tâche, du projet, etc.
  details?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'mention' | 'task_assigned' | 'deadline_approaching' | 'project_update';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
