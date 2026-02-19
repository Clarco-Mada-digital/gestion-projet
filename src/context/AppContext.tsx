import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Project, Task, ReportEntry, User, UserSettings, ViewMode, Theme, EmailSettings, AppSettings, DEFAULT_AI_SETTINGS, FontSize, AISettings } from '../types';
import { firebaseService } from '../services/collaboration/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';

export interface AppState {
  projects: Project[];
  tasks: Task[]; // Ajout des tâches au niveau racine
  users: User[];
  cloudUser: FirebaseUser | null;
  googleAccessToken?: string;
  theme: 'light' | 'dark';
  currentView: string;
  emailSettings: EmailSettings;
  appSettings: AppSettings & {
    aiSettings: AISettings; // Assurez-vous que AISettings est importé
  };
  notifications: any[];
  isLoading: boolean;
  error: string | null;
  selectedProject: string | null;
  targetProjectId?: string | null;
  targetTaskId?: string | null;
  reports: ReportEntry[];
  // L'utilisateur principal est le premier utilisateur du tableau users
}

type AppAction =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'SET_VIEW'; payload: ViewMode }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SELECTED_PROJECT'; payload: string | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'UPDATE_EMAIL_SETTINGS'; payload: Partial<EmailSettings> }
  | { type: 'UPDATE_APP_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_FONT_SIZE'; payload: FontSize }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INIT_STATE'; payload: any }
  | { type: 'IMPORT_DATA'; payload: any }
  | { type: 'EXPORT_DATA' }
  | { type: 'SET_CLOUD_USER'; payload: FirebaseUser | null }
  | { type: 'SET_GOOGLE_TOKEN'; payload: string | undefined }
  | { type: 'SYNC_PROJECTS'; payload: Project[] }
  | { type: 'ADD_REPORT'; payload: ReportEntry }
  | { type: 'DELETE_REPORT'; payload: string }
  | { type: 'UPDATE_REPORT'; payload: ReportEntry }
  | { type: 'SET_ACCENT_COLOR'; payload: string }
  | { type: 'UPDATE_BRANDING'; payload: any }
  | { type: 'NAVIGATE_TO_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'CLEAR_NAVIGATION_REQUEST' };

// Type pour les données exportables
export interface ExportableData {
  projects: Project[];
  users: User[];
  theme: 'light' | 'dark';
  emailSettings: EmailSettings;
  appSettings: AppSettings;
  version: string;
  exportedAt: string;
}

// Données par défaut pour l'utilisateur principal
const defaultUser: User = {
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

// Données d'exemple (Vides au début)


// Interface pour les paramètres EmailJS
export interface EmailJsSettings {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

// Interface pour les paramètres EmailJS
export interface EmailJsSettings {
  serviceId: string;
  templateId: string;
  userId: string;
  accessToken?: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
}

// Paramètres par défaut de l'application
const initialAppSettings: AppSettings & { aiSettings: AISettings } = {
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
  brandingSettings: {
    companyName: 'Mon Entreprise',
    primaryColor: '#3B82F6',
    sidebarTheme: 'glass',
    welcomeMessage: 'Bienvenue dans votre espace projet'
  }
};

const initialState: AppState = {
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
  theme: 'light',
  currentView: 'today',
  emailSettings: {
    serviceId: '',
    templateId: 'template_default',
    userId: '',
    accessToken: '',
    fromEmail: '',
    fromName: 'Gestion de Projet',
    isEnabled: true
  },
  appSettings: initialAppSettings,
  notifications: [],
  isLoading: false,
  error: null,
  selectedProject: null,
  targetProjectId: null,
  targetTaskId: null,
  reports: []
};

// Fonction utilitaire pour extraire toutes les tâches des projets
const extractAllTasks = (projects: Project[]): Task[] => {
  return projects.flatMap(project => project.tasks || []);
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload,
        tasks: extractAllTasks(action.payload)
      };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        tasks: [...state.tasks, ...(action.payload.tasks || [])]
      };
    case 'UPDATE_PROJECT': {
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.id ? action.payload : project
      );
      return {
        ...state,
        projects: updatedProjects,
        tasks: extractAllTasks(updatedProjects)
      };
    }
    case 'DELETE_PROJECT': {
      const remainingProjects = state.projects.filter(project => project.id !== action.payload);
      return {
        ...state,
        projects: remainingProjects,
        tasks: extractAllTasks(remainingProjects),
        selectedProject: state.selectedProject === action.payload ? null : state.selectedProject
      };
    }
    case 'ADD_TASK': {
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.projectId
          ? {
            ...project,
            tasks: [...(project.tasks || []), action.payload.task],
            updatedAt: new Date().toISOString()
          }
          : project
      );
      return {
        ...state,
        projects: updatedProjects,
        tasks: [...state.tasks, action.payload.task]
      };
    }
    case 'UPDATE_TASK': {
      const updatedProjects = state.projects.map(project => {
        if (!project.tasks) return project;
        const taskExists = project.tasks.some(t => t.id === action.payload.id);
        if (!taskExists) return project;

        return {
          ...project,
          updatedAt: new Date().toISOString(),
          tasks: project.tasks.map(task => {
            if (task.id === action.payload.id) {
              // Si la tâche passe à l'état 'done', on met à jour completedAt
              const completedAt = action.payload.status === 'done' && task.status !== 'done'
                ? new Date().toISOString()
                : action.payload.completedAt || task.completedAt;

              return {
                ...action.payload,
                completedAt: action.payload.completedAt || completedAt
              };
            }
            return task;
          })
        };
      });

      const updatedTasks = state.tasks.map(task =>
        task.id === action.payload.id ? action.payload : task
      );

      return {
        ...state,
        projects: updatedProjects,
        tasks: updatedTasks
      };
    }
    case 'DELETE_TASK': {
      const updatedProjects = state.projects.map(project => {
        if (project.id !== action.payload.projectId) return project;
        return {
          ...project,
          updatedAt: new Date().toISOString(),
          tasks: project.tasks?.filter(task => task.id !== action.payload.taskId) || [],
        };
      });

      return {
        ...state,
        projects: updatedProjects,
        tasks: state.tasks.filter(task =>
          !(task.id === action.payload.taskId && task.projectId === action.payload.projectId)
        )
      };
    }
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? {
            ...user,
            ...action.payload,
            updatedAt: new Date().toISOString()
          } : user
        )
      };
    case 'ADD_USER': {
      // Vérifier si l'utilisateur existe déjà par email
      const userExists = state.users.some(user => user.email === action.payload.email);

      if (userExists) {
        console.warn('Un utilisateur avec cet email existe déjà');
        return state;
      }

      // Créer un nouvel utilisateur avec un ID unique et des timestamps
      const now = new Date().toISOString();

      // Créer un objet settings avec des valeurs par défaut complètes
      const defaultUserSettings: UserSettings = {
        theme: 'light',
        language: 'fr',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: true,
        emailNotifications: true,
        pushNotifications: true,
        daysOff: ['saturday', 'sunday']
      };

      // Fusionner avec les paramètres fournis, en s'assurant que tous les champs requis sont définis
      const userSettings: UserSettings = {
        ...defaultUserSettings,
        ...(action.payload.settings || {})
      };

      // S'assurer que les champs obligatoires ne sont pas undefined
      userSettings.language = userSettings.language || 'fr';
      userSettings.timezone = userSettings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      const newUser: User = {
        id: `user-${Date.now()}`,
        name: action.payload.name || '',
        email: action.payload.email || '',
        avatar: action.payload.avatar || '',
        phone: action.payload.phone || '',
        position: action.payload.position || '',
        department: action.payload.department || '',
        role: (action.payload.role as 'admin' | 'member' | 'viewer') || 'member',
        status: 'active',
        lastActive: now,
        createdAt: now,
        updatedAt: now,
        settings: userSettings,
        isPrimary: false,
        cannotDelete: false
      };

      return {
        ...state,
        users: [...state.users, newUser]
      };
    }
    case 'REMOVE_USER':
      // Ne pas permettre la suppression de l'utilisateur principal
      if (action.payload === state.users[0]?.id) {
        console.warn('Impossible de supprimer l\'utilisateur principal');
        return state;
      }
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      };
    case 'UPDATE_EMAIL_SETTINGS': {
      // S'assurer que tous les champs requis sont présents
      const updatedSettings = {
        ...state.emailSettings,
        ...action.payload,
        // Forcer le typage pour s'assurer que les champs requis sont présents
        serviceId: action.payload.serviceId ?? state.emailSettings.serviceId,
        templateId: action.payload.templateId ?? state.emailSettings.templateId ?? 'template_default',
        userId: action.payload.userId ?? state.emailSettings.userId,
        fromEmail: action.payload.fromEmail ?? state.emailSettings.fromEmail,
        fromName: action.payload.fromName ?? state.emailSettings.fromName ?? 'Gestion de Projet',
        isEnabled: action.payload.isEnabled ?? state.emailSettings.isEnabled ?? true
      };



      return {
        ...state,
        emailSettings: updatedSettings
      };
    }
    case 'UPDATE_APP_SETTINGS':
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          ...action.payload
        }
      };
    case 'SET_FONT_SIZE':
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          fontSize: action.payload
        }
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'INIT_STATE': {
      const { users, reports, ...rest } = action.payload;
      // S'assurer qu'il y a toujours au moins un utilisateur et des rapports valides
      const validUsers = users && users.length > 0 ? users : [defaultUser];
      const validReports = reports || [];
      return { ...state, ...rest, users: validUsers, reports: validReports };
    }
    case 'SET_ACCENT_COLOR':
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          accentColor: action.payload
        },
        users: state.users.map(user => ({
          ...user,
          settings: {
            theme: 'light',
            language: 'fr',
            timezone: 'UTC',
            notifications: true,
            emailNotifications: true,
            ...user.settings,
            accentColor: action.payload
          } as UserSettings
        }))
      };
    case 'UPDATE_BRANDING':
      return {
        ...state,
        appSettings: {
          ...state.appSettings,
          brandingSettings: {
            ...state.appSettings.brandingSettings,
            ...action.payload
          }
        }
      };
    case 'IMPORT_DATA':
      try {
        const data = action.payload;
        // S'assurer que les champs requis existent
        if (!data.projects || !data.users) {
          throw new Error("Données d'importation invalides");
        }

        return {
          ...state,
          projects: data.projects || state.projects,
          users: data.users || state.users,
          theme: data.theme || state.theme,
          emailSettings: data.emailSettings ? { ...state.emailSettings, ...data.emailSettings } : state.emailSettings,
          appSettings: data.appSettings ? { ...state.appSettings, ...data.appSettings } : state.appSettings,
        };
      } catch (error) {
        console.error("Erreur lors de l'importation des données:", error);
        return { ...state, error: "Erreur lors de l'importation des données" };
      }
    case 'EXPORT_DATA':
      // L'exportation est gérée dans le composant, cette action ne modifie pas l'état
      return state;
    case 'SET_CLOUD_USER':
      return { ...state, cloudUser: action.payload };
    case 'SET_GOOGLE_TOKEN':
      return { ...state, googleAccessToken: action.payload };
    case 'SYNC_PROJECTS': {
      const incomingProjects = action.payload; // Projets venant du Cloud
      const incomingIds = new Set(incomingProjects.map(p => p.id));

      // 1. On garde les projets strictement locaux
      const localOnlyProjects = state.projects.filter(p => p.source !== 'firebase');

      // 2. On fusionne les projets Firebase entrants avec l'état local
      const mergedFirebaseProjects = incomingProjects.map(incoming => {
        const local = state.projects.find(p => p.id === incoming.id);
        if (local && local.source === 'firebase') {
          // Résolution de conflit : Si la version locale est plus récente, on la garde (changement en attente de sync)
          if (new Date(local.updatedAt) > new Date(incoming.updatedAt)) {
            return local;
          }
        }
        return incoming;
      });

      // 3. On gère les projets Firebase locaux qui ne sont PAS dans la liste entrante
      // Si un projet a lastSyncedAt, c'est qu'il a été supprimé du serveur -> on le supprime (ne pas l'inclure)
      // Si un projet n'a PAS lastSyncedAt, c'est qu'il vient d'être créé localement et pas encore sync -> on le garde
      const pendingCreationProjects = state.projects.filter(p =>
        p.source === 'firebase' &&
        !incomingIds.has(p.id) &&
        !p.lastSyncedAt
      );

      const updatedProjects = [
        ...localOnlyProjects,
        ...mergedFirebaseProjects,
        ...pendingCreationProjects
      ];

      return {
        ...state,
        projects: updatedProjects,
        tasks: extractAllTasks(updatedProjects)
      };
    }
    case 'ADD_REPORT':
      return {
        ...state,
        reports: [action.payload, ...state.reports]
      };
    case 'DELETE_REPORT':
      return {
        ...state,
        reports: state.reports.filter(report => report.id !== action.payload)
      };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map(report =>
          report.id === action.payload.id ? action.payload : report
        )
      };
    case 'NAVIGATE_TO_TASK':
      return {
        ...state,
        currentView: 'projects',
        targetProjectId: action.payload.projectId,
        targetTaskId: action.payload.taskId
      };
    case 'CLEAR_NAVIGATION_REQUEST':
      return {
        ...state,
        targetProjectId: null,
        targetTaskId: null
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Effet pour synchroniser avec Firebase
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange(async (user) => {
      dispatch({ type: 'SET_CLOUD_USER', payload: user });

      if (user) {
        try {
          // S'assurer que le profil est à jour pour la recherche par email
          await firebaseService.saveUserProfile(user);

          const sharedProjects = await firebaseService.getSharedProjects();
          dispatch({ type: 'SYNC_PROJECTS', payload: sharedProjects });
        } catch (error) {
          console.error("Erreur lors de la synchronisation:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Rafraîchir les données périodiquement ou quand on change de vue (Projects ou Kanban)
  useEffect(() => {
    if (!state.cloudUser) return;

    const refreshData = async () => {
      try {
        const sharedProjects = await firebaseService.getSharedProjects();
        if (sharedProjects.length > 0) {
          // Check if data actually changed before dispatching to prevent re-renders
          const currentFirebaseProjects = state.projects.filter(p => p.source === 'firebase');

          // Simple check: different count or different last update timestamps
          const hasChanged =
            sharedProjects.length !== currentFirebaseProjects.length ||
            JSON.stringify(sharedProjects.map(p => ({ id: p.id, updated: p.updatedAt }))) !==
            JSON.stringify(currentFirebaseProjects.map(p => ({ id: p.id, updated: p.updatedAt })));

          if (hasChanged) {
            dispatch({ type: 'SYNC_PROJECTS', payload: sharedProjects });
          }
        }
      } catch (error) {
        console.error("Erreur lors du rafraîchissement des données:", error);
      }
    };

    // Rafraîchir au changement de vue ou de connexion
    if (state.currentView === 'projects' || state.currentView === 'kanban') {
      refreshData();
    }

    // Polling toutes les 60 secondes (moins fréquent pour éviter les glitchs)
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, [state.currentView, state.cloudUser]); // REMOVED state.projects dependency

  // Synchronisation automatique des modifications vers Firebase
  useEffect(() => {
    if (!state.cloudUser || state.isLoading) return;

    const syncModifiedProjects = async () => {
      const firebaseProjects = state.projects.filter(p => p.source === 'firebase');

      for (const project of firebaseProjects) {
        try {
          if (!project.lastSyncedAt || new Date(project.updatedAt) > new Date(project.lastSyncedAt)) {
            const syncTime = new Date().toISOString();
            await firebaseService.syncProject(project);

            // Mettre à jour localement pour marquer comme synchronisé
            // NOTE: This dispatch might trigger the other effect, ensuring data is fresh.
            // But since we update lastSyncedAt, it won't loop infinitely.
            dispatch({
              type: 'UPDATE_PROJECT',
              payload: { ...project, lastSyncedAt: syncTime }
            });
          }
        } catch (error) {
          console.error(`Erreur sync projet ${project.id}:`, error);
        }
      }
    };

    // Délai réduit à 2000ms pour plus de réactivité maintenant que le merge est intelligent
    const timer = setTimeout(syncModifiedProjects, 2000);
    return () => clearTimeout(timer);
  }, [state.projects, state.cloudUser, state.isLoading, dispatch]);

  // Effet pour charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedData = localStorage.getItem('astroProjectManagerData');
        const savedTheme = localStorage.getItem('astroProjectManagerTheme') as Theme | null;
        const savedAppSettings = localStorage.getItem('astroProjectManagerAppSettings');
        const savedEmailSettings = localStorage.getItem('astroProjectManagerEmailSettings');

        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // S'assurer qu'il y a au moins un utilisateur
          const users = parsedData.users && parsedData.users.length > 0
            ? parsedData.users
            : [defaultUser];

          // Vérification que la vue est valide
          const validViews: ViewMode[] = ['today', 'projects', 'kanban', 'calendar', 'settings'];
          const viewToSet = parsedData.currentView || 'today';

          // Charger les paramètres email sauvegardés de manière sécurisée
          let emailSettings = initialState.emailSettings;
          if (savedEmailSettings) {
            try {
              const parsedEmailSettings = JSON.parse(savedEmailSettings);
              if (parsedEmailSettings && (parsedEmailSettings.serviceId || parsedEmailSettings.userId)) {
                emailSettings = { ...initialState.emailSettings, ...parsedEmailSettings };
              } else {
                // Fallback vers l'ancien emplacement dans parsedData si le nouveau est vide
                if (parsedData.emailSettings && (parsedData.emailSettings.serviceId || parsedData.emailSettings.userId)) {
                  emailSettings = { ...initialState.emailSettings, ...parsedData.emailSettings };
                }
              }
            } catch (error) {
              console.error('Erreur lors du chargement des paramètres email:', error);
            }
          } else if (parsedData.emailSettings) {
            // Si pas de clé séparée, regarder dans le blob principal
            emailSettings = { ...initialState.emailSettings, ...parsedData.emailSettings };
          }

          // Charger les paramètres d'apparence sauvegardés
          let appSettings = initialAppSettings;
          if (savedAppSettings) {
            try {
              appSettings = { ...initialAppSettings, ...JSON.parse(savedAppSettings) };
            } catch (error) {
              console.error('Erreur lors du chargement des paramètres d\'apparence:', error);
            }
          } else if (parsedData.appSettings) {
            appSettings = { ...initialAppSettings, ...parsedData.appSettings };
          }

          // Mettre à jour l'état avec les données chargées
          dispatch({
            type: 'INIT_STATE',
            payload: {
              ...parsedData,
              users,
              // Priorité au thème sauvegardé spécifiquement
              theme: savedTheme || parsedData.theme || 'light',
              currentView: validViews.includes(viewToSet) ? viewToSet : 'today',
              appSettings,
              emailSettings
            }
          });
        } else {
          // Utiliser les valeurs par défaut vides
          dispatch({
            type: 'INIT_STATE',
            payload: {
              ...initialState,
              theme: savedTheme || 'light',
              users: [defaultUser],
              projects: []
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // En cas d'erreur, utiliser les valeurs par défaut vides
        dispatch({
          type: 'INIT_STATE',
          payload: {
            ...initialState,
            users: [defaultUser],
            projects: []
          }
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();
  }, []);

  // Effet pour sauvegarder les données principales (sans emailSettings et appSettings)
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      // Préparer les données à sauvegarder en excluant les paramètres sensibles
      const { isLoading, error, notifications, emailSettings, appSettings, ...dataToSave } = state;

      localStorage.setItem('astroProjectManagerData', JSON.stringify({
        ...dataToSave,
        // S'assurer que les notifications ne sont pas sauvegardées
        notifications: []
      }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données principales:', error);
    }
  }, [state.projects, state.users, state.theme, state.currentView, state.selectedProject, state.reports, state.isLoading]);

  // Effet séparé pour sauvegarder les paramètres email (sécurisé)
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      localStorage.setItem('astroProjectManagerEmailSettings', JSON.stringify(state.emailSettings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres email:', error);
    }
  }, [state.emailSettings, state.isLoading]);



  // Effet séparé pour sauvegarder les paramètres d'apparence
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      localStorage.setItem('astroProjectManagerAppSettings', JSON.stringify(state.appSettings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres d\'apparence:', error);
    }
  }, [state.appSettings, state.isLoading]);

  // Effet pour sauvegarder le thème immédiatement
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      localStorage.setItem('astroProjectManagerTheme', state.theme);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  }, [state.theme, state.isLoading]);

  // Appliquer le thème
  useEffect(() => {
    const theme = state.theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [state.theme]);

  // Appliquer les paramètres d'apparence au chargement et lors des changements
  useEffect(() => {
    if (state.isLoading) return;

    // Appliquer la couleur d'accent
    if (state.appSettings.accentColor) {
      const colorMap: Record<string, string> = {
        blue: '#3b82f6',
        indigo: '#6366f1',
        purple: '#a855f7',
        pink: '#ec4899',
        red: '#ef4444',
        orange: '#f97316',
        yellow: '#eab308',
        green: '#22c55e',
        emerald: '#10b981',
        teal: '#14b8a6',
        cyan: '#06b6d4',
      };

      const color = colorMap[state.appSettings.accentColor] || '#3b82f6';
      document.documentElement.style.setProperty('--primary-color', color);

      // Injecter les styles pour la couleur d'accent
      const styleId = 'dynamic-theme-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      styleEl.innerHTML = `
        :root {
          --color-primary: ${color};
        }
        
        /* Override common blue classes */
        .bg-blue-500 { background-color: ${color} !important; }
        .bg-blue-600 { background-color: ${color} !important; filter: brightness(0.9); }
        .hover\\:bg-blue-600:hover { background-color: ${color} !important; filter: brightness(0.9); }
        .hover\\:bg-blue-700:hover { background-color: ${color} !important; filter: brightness(0.8); }
        .text-blue-500 { color: ${color} !important; }
        .text-blue-600 { color: ${color} !important; filter: brightness(0.9); }
        .border-blue-500 { border-color: ${color} !important; }
        .focus\\:ring-blue-500:focus { --tw-ring-color: ${color} !important; }
      `;
    }

    // Appliquer la taille de police
    const fontSize = state.appSettings.fontSize || 'medium';
    document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    document.documentElement.classList.add(`font-size-${fontSize}`);

  }, [state.appSettings, state.isLoading]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};