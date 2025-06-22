export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignees: string[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  subTasks: SubTask[];
  notes?: string;
  startDate?: string;
  estimatedHours?: number;
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
  settings?: {
    theme: string;
    language: string;
    timezone: string;
    notifications: boolean;
    emailNotifications: boolean;
    daysOff?: DayOfWeek[]; // Jours de repos hebdomadaires
  };
  isPrimary?: boolean;
  cannotDelete?: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
  daysOff?: DayOfWeek[]; // Pour rétrocompatibilité
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'today' | 'projects' | 'kanban' | 'calendar' | 'settings';

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  useSSL: boolean;
  useTLS: boolean;
}

export interface AppSettings {
  theme: Theme;
  defaultView: ViewMode;
  itemsPerPage: number;
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
}
export type Theme = 'light' | 'dark';