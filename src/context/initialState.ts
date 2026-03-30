import { User, UserSettings, EmailSettings, AppSettings, AISettings, DEFAULT_AI_SETTINGS, AppState } from '../types';

export const defaultUser: User = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@example.com',
  avatar: '',
  phone: '+261 34 00 000 00',
  position: 'Administrateur',
  department: 'Direction',
  role: 'admin' as const,
  status: 'active' as const,
  lastActive: new Date().toISOString(),
  settings: {
    theme: 'light',
    language: 'fr',
    timezone: 'Indian/Antananarivo',
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    daysOff: ['saturday', 'sunday']
  } as UserSettings,
  isPrimary: true,
  cannotDelete: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const initialEmailSettings: EmailSettings = {
  serviceId: '',
  templateId: 'template_default',
  userId: '',
  accessToken: '',
  fromEmail: '',
  fromName: 'Gestion de Projet',
  isEnabled: true,
  defaultSubject: 'Delivery du %dd au %df'
};

export const initialAppSettings: AppSettings & { aiSettings: AISettings } = {
  theme: 'light',
  fontSize: 'medium',
  contacts: [],
  defaultView: 'today',
  itemsPerPage: 10,
  enableAnalytics: false,
  enableErrorReporting: false,
  aiSettings: DEFAULT_AI_SETTINGS,
  kanbanSettings: {
    columnOrder: [],
    taskOrder: {},
    customColumns: []
  },
  accentColor: 'blue',
  fontFamily: 'Inter',
  brandingSettings: {
    companyName: 'Mon Entreprise',
    primaryColor: '#3B82F6',
    sidebarTheme: 'glass',
    welcomeMessage: 'Bienvenue dans votre espace projet'
  },
  pushNotifications: true
};

export const initialState: AppState = {
  projects: [],
  tasks: [],
  users: [{
    ...defaultUser,
    settings: {
      theme: 'light',
      language: 'fr',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifications: true,
      emailNotifications: true,
      pushNotifications: true,
      daysOff: ['saturday', 'sunday']
    }
  }],
  cloudUser: null,
  googleAccessToken: undefined,
  googleTokenTimestamp: undefined,
  calendarEmail: undefined,
  theme: 'light',
  currentView: 'today',
  emailSettings: initialEmailSettings,
  appSettings: initialAppSettings,
  notifications: [],
  isLoading: true,
  error: null,
  selectedProject: null,
  targetProjectId: null,
  targetTaskId: null,
  reports: [],
  visionDossiers: []
};
