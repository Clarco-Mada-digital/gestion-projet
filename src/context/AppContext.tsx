import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Project, Task, ReportEntry, User, UserSettings, ViewMode, Theme, EmailSettings, AppSettings, DEFAULT_AI_SETTINGS, FontSize, AISettings } from '../types';
import { firebaseService } from '../services/collaboration/firebaseService';
import { EncryptionService } from '../services/security/encryptionService';
import { User as FirebaseUser } from 'firebase/auth';

export interface AppState {
  projects: Project[];
  tasks: Task[]; // Ajout des tâches au niveau racine
  users: User[];
  cloudUser: FirebaseUser | null;
  googleAccessToken?: string;
  googleTokenTimestamp?: number;
  calendarEmail?: string;
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
  | { type: 'UPDATE_USER_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_FONT_SIZE'; payload: FontSize }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INIT_STATE'; payload: any }
  | { type: 'IMPORT_DATA'; payload: any }
  | { type: 'EXPORT_DATA' }
  | { type: 'SET_CLOUD_USER'; payload: FirebaseUser | null }
  | { type: 'SET_GOOGLE_TOKEN'; payload: { token: string; timestamp: number } | string | undefined }
  | { type: 'SET_CALENDAR_EMAIL'; payload: string | undefined }
  | { type: 'CLEAR_GOOGLE_SESSION' }
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
const initialEmailSettings: EmailSettings = {
  serviceId: '',
  templateId: 'template_default',
  userId: '',
  accessToken: '',
  fromEmail: '',
  fromName: 'Gestion de Projet',
  isEnabled: true,
  defaultSubject: 'Delivery du %dd au %df'
};

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
  fontFamily: 'Inter',
  brandingSettings: {
    companyName: 'Mon Entreprise',
    primaryColor: '#3B82F6',
    sidebarTheme: 'glass',
    welcomeMessage: 'Bienvenue dans votre espace projet'
  },
  pushNotifications: true
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
        if (project.id === action.payload.projectId) {
          const updatedTasks = project.tasks.map(task =>
            task.id === action.payload.id ? action.payload : task
          );
          return {
            ...project,
            tasks: updatedTasks,
            updatedAt: new Date().toISOString()
          };
        }
        return project;
      });
      return {
        ...state,
        projects: updatedProjects,
        tasks: extractAllTasks(updatedProjects)
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
        isEnabled: action.payload.isEnabled ?? state.emailSettings.isEnabled ?? true,
        defaultSubject: action.payload.defaultSubject ?? state.emailSettings.defaultSubject ?? 'Delivery du %dd au %df'
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
    case 'UPDATE_USER_SETTINGS':
      return {
        ...state,
        users: state.users.map(user => ({
          ...user,
          settings: {
            theme: 'light',
            language: 'fr',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: true,
            emailNotifications: true,
            ...user.settings,
            ...action.payload
          } as UserSettings
        }))
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
      if (typeof action.payload === 'object' && action.payload !== null && 'token' in action.payload) {
        return {
          ...state,
          googleAccessToken: action.payload.token,
          googleTokenTimestamp: action.payload.timestamp
        };
      }
      return { ...state, googleAccessToken: action.payload as string | undefined };
    case 'SET_CALENDAR_EMAIL':
      return { ...state, calendarEmail: action.payload };
    case 'CLEAR_GOOGLE_SESSION':
      return { ...state, googleAccessToken: undefined, googleTokenTimestamp: undefined, calendarEmail: undefined };
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

  // Effet pour synchroniser avec Firebase (ÉCOUTE EN TEMPS RÉEL)
  useEffect(() => {
    let unsubscribeProjects: (() => void) | null = null;

    const unsubscribeAuth = firebaseService.onAuthStateChange(async (user) => {
      dispatch({ type: 'SET_CLOUD_USER', payload: user });

      // Nettoyer l'écouteur précédent si l'utilisateur change ou se déconnecte
      if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
      }

      if (user) {
        try {
          // S'assurer que le profil est à jour pour la recherche par email
          await firebaseService.saveUserProfile(user);

          // Écouteur en temps réel pour tous les projets où l'utilisateur est membre
          unsubscribeProjects = firebaseService.onSharedProjectsUpdate(user.uid, async (sharedProjects) => {
            console.log(`[Cloud Sync] ${sharedProjects.length} projets partagés reçus du Cloud`);
            
            // Déchiffrement des projets si nécessaire
            const decryptedProjects = await Promise.all(sharedProjects.map(async (p) => {
              const localKey = EncryptionService.getProjectKey(p.id);
              if (p.isEncryptionEnabled && localKey) {
                return await firebaseService.decryptProject(p, localKey);
              }
              return p;
            }));

            dispatch({ type: 'SYNC_PROJECTS', payload: decryptedProjects });
          });
        } catch (error) {
          console.error("Erreur lors de la synchronisation initiale:", error);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProjects) unsubscribeProjects();
    };
  }, []);

  // Effet pour naviguer vers une tâche si demandée (ex: via notification)
  useEffect(() => {
    if (!state.isLoading && state.targetProjectId && state.targetTaskId) {
      // Déjà géré par NAVIGATE_TO_TASK qui change currentView
      // Mais on s'assure que selectedProject est bon
      if (state.selectedProject !== state.targetProjectId) {
        dispatch({ type: 'SET_SELECTED_PROJECT', payload: state.targetProjectId });
      }
    }
  }, [state.targetProjectId, state.targetTaskId, state.isLoading]);

  useEffect(() => {
    const loadInitialData = () => {
      try {
        console.log('[Persistence] Chargement des données initiales...');

        // 1. Charger les différents blocs depuis localStorage
        const savedData = localStorage.getItem('astroProjectManagerData');
        const savedTheme = localStorage.getItem('astroProjectManagerTheme') as Theme | null;
        const savedAppSettings = localStorage.getItem('astroProjectManagerAppSettings');
        const savedEmailSettings = localStorage.getItem('astroProjectManagerEmailSettings');
        const savedNotificationSettings = localStorage.getItem('notificationSettings');
        const savedGoogleToken = localStorage.getItem('astroProjectManagerGoogleToken');
        const savedGoogleTokenTimestamp = localStorage.getItem('astroProjectManagerGoogleTokenTimestamp');
        const savedCalendarEmail = localStorage.getItem('astroProjectManagerCalendarEmail');

        // 2. Préparer les valeurs par défaut
        let emailSettings = { ...initialEmailSettings };
        let appSettings = { ...initialAppSettings };
        let mainData = { projects: [] as Project[], users: [defaultUser], reports: [] as ReportEntry[] };

        // 3. Charger les paramètres email (Priorité à la clé dédiée)
        if (savedEmailSettings) {
          try {
            const parsed = JSON.parse(savedEmailSettings);
            if (parsed) {
              emailSettings = { ...emailSettings, ...parsed };
              console.log('[Persistence] Paramètres email chargés depuis sa clé dédiée');
            }
          } catch (e) { console.error('Erreur JSON emailSettings', e); }
        }

        // 4. Charger les paramètres d'apparence
        if (savedAppSettings) {
          try {
            const parsed = JSON.parse(savedAppSettings);
            if (parsed) {
              appSettings = { ...appSettings, ...parsed };
              console.log('[Persistence] Paramètres apparence chargés');
            }
          } catch (e) { console.error('Erreur JSON appSettings', e); }
        }

        // 4.1. Charger les paramètres de notifications et mettre à jour appSettings
        if (savedNotificationSettings) {
          try {
            const parsed = JSON.parse(savedNotificationSettings);
            if (parsed) {
              const isAnyNotificationEnabled = parsed.taskReminders || parsed.taskOverdue || parsed.taskCompleted || parsed.projectMilestones;
              appSettings = { ...appSettings, pushNotifications: isAnyNotificationEnabled };
              console.log('[Persistence] Paramètres notifications chargés et appliqués à appSettings');
            }
          } catch (e) { console.error('Erreur JSON notificationSettings', e); }
        }

        // 5. Charger les données principales
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            mainData = { ...mainData, ...parsed };

            // Migration/Fallback : si les paramètres email étaient dans le blob principal
            if (parsed.emailSettings && !savedEmailSettings) {
              emailSettings = { ...emailSettings, ...parsed.emailSettings };
              console.log('[Persistence] Fallback emailSettings depuis main blob');
            }
            if (parsed.appSettings && !savedAppSettings) {
              appSettings = { ...appSettings, ...parsed.appSettings };
            }
          } catch (e) { console.error('Erreur JSON mainData', e); }
        }

        // 6. Finaliser l'état initial
        const validViews: ViewMode[] = ['today', 'projects', 'kanban', 'calendar', 'settings'];
        const currentView = (mainData as any).currentView || 'today';

        const googleTokenTimestamp = savedGoogleTokenTimestamp ? parseInt(savedGoogleTokenTimestamp) : undefined;

        try {
        dispatch({
          type: 'INIT_STATE',
          payload: {
            ...mainData,
            theme: savedTheme || (mainData as any).theme || 'light',
            currentView: validViews.includes(currentView) ? currentView : 'today',
            appSettings,
            emailSettings,
            googleAccessToken: savedGoogleToken || undefined,
            googleTokenTimestamp,
            calendarEmail: savedCalendarEmail || undefined,
            isLoading: false // Crucial pour arrêter l'écran de chargement
          }
        });

        } catch (error) {
        console.error('[Persistence] Erreur critique lors du chargement:', error);
        dispatch({
          type: 'INIT_STATE',
          payload: initialState
        });
        }
      } catch (error) {
        console.error('[Persistence] Erreur globale lors du chargement des données:', error);
        // On s'assure de sortir du chargement même en cas d'erreur
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    const timer = setTimeout(loadInitialData, 10);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // ─── Effet 1 : Sauvegarde locale (localStorage) ───────────────────────────
  // S'exécute à chaque changement de projets, utilisateurs, thème, vue ou RAPPORTS
  // IMPORTANT : state.reports DOIT être dans les dépendances pour ne pas perdre l'historique
  useEffect(() => {
    if (state.isLoading) return;

    try {
      const { isLoading, error, notifications, emailSettings, appSettings, cloudUser, ...dataToSave } = state;

      localStorage.setItem('astroProjectManagerData', JSON.stringify({
        ...dataToSave,
        notifications: [] // On ne persiste pas les notifications
      }));
      console.log('[Persistence] Données principales sauvegardées (projets + rapports)');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde locale:', error);
    }
  }, [state.projects, state.users, state.theme, state.currentView, state.selectedProject, state.reports, state.isLoading]);

  // ─── Effet 2 : Synchronisation Cloud Firebase ────────────────────────────
  // Séparé de la sauvegarde locale pour éviter de bloquer le thread sur les gros projets
  useEffect(() => {
    if (state.isLoading || !state.cloudUser) return;

    const cloudUser = state.cloudUser;
    state.projects
      .filter(p => p.source === 'firebase')
      .forEach(project => {
        // 1. On vérifie si le projet lui-même a été modifié
        const projectNeedsSync = !project.lastSyncedAt ||
          new Date(project.updatedAt).getTime() > new Date(project.lastSyncedAt).getTime() + 1000;

        if (projectNeedsSync) {
          setTimeout(() => {
            firebaseService.syncProject(project)
              .then(() => console.log(`[Cloud Sync] Synchro Projet réussie: ${project.name}`))
              .catch(err => console.error('[Cloud Sync] Erreur synchro Projet:', err));
          }, 1000);
        } else {
          // 2. Synchronisation granulaire par tâche si le projet global n'a pas changé
          project.tasks?.forEach(task => {
            const taskNeedsSync = !project.lastSyncedAt ||
              new Date(task.updatedAt).getTime() > new Date(project.lastSyncedAt).getTime() + 1000;

            if (taskNeedsSync) {
              setTimeout(() => {
                firebaseService.syncTask(project.id, task, project.encryptionKey)
                  .then(() => console.log(`[Cloud Sync] Synchro Tâche réussie: ${task.title}`))
                  .catch(err => console.error('[Cloud Sync] Erreur synchro Tâche:', err));
              }, 500);
            }
          });
        }
      });
    // Supprimer avertissement ESLint pour cloudUser (utilisé indirectement via la condition)
    void cloudUser;
  }, [state.projects, state.cloudUser, state.isLoading]);

  // Effet séparé pour sauvegarder les paramètres email (sécurisé)
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      localStorage.setItem('astroProjectManagerEmailSettings', JSON.stringify(state.emailSettings));
      console.log('[Persistence] Paramètres email sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres email:', error);
    }
  }, [state.emailSettings, state.isLoading]);

  // Effet séparé pour sauvegarder les paramètres de l'application (apparence, etc.)
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      localStorage.setItem('astroProjectManagerAppSettings', JSON.stringify(state.appSettings));
      console.log('[Persistence] Paramètres application sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres app:', error);
    }
  }, [state.appSettings, state.isLoading]);



  // Effet pour charger les données initiales au démarrage
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial

    try {
      localStorage.setItem('astroProjectManagerTheme', state.theme);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  }, [state.theme, state.isLoading]);

  // Sauvegarder les jetons Google pour éviter la reconnexion à chaque redémarrage
  useEffect(() => {
    if (state.isLoading) return;
    try {
      if (state.googleAccessToken) {
        localStorage.setItem('astroProjectManagerGoogleToken', state.googleAccessToken);
        if (state.googleTokenTimestamp) {
          localStorage.setItem('astroProjectManagerGoogleTokenTimestamp', state.googleTokenTimestamp.toString());
        }
      } else {
        localStorage.removeItem('astroProjectManagerGoogleToken');
        localStorage.removeItem('astroProjectManagerGoogleTimestamp');
      }

      if (state.calendarEmail) {
        localStorage.setItem('astroProjectManagerCalendarEmail', state.calendarEmail);
      } else {
        localStorage.removeItem('astroProjectManagerCalendarEmail');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session Google:', error);
    }
  }, [
    state.googleAccessToken,
    state.googleTokenTimestamp,
    state.calendarEmail,
    state.isLoading
  ]);

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

    // Appliquer la police d'écriture
    if (state.appSettings.fontFamily) {
      const fontId = 'dynamic-font-link';
      let linkEl = document.getElementById(fontId) as HTMLLinkElement;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = fontId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      const fontName = state.appSettings.fontFamily;
      // Ne pas recharger si c'est déjà la même
      const formattedFontName = fontName.replace(/ /g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@300;400;500;600;700&display=swap`;
      if (linkEl.href !== href) {
        linkEl.href = href;
      }

      // Injecter le style global pour la police
      const fontStyleId = 'dynamic-font-style';
      let styleEl = document.getElementById(fontStyleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = fontStyleId;
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        html, body, button, input, select, textarea, .font-custom {
          font-family: "${fontName}", sans-serif !important;
        }
      `;
    }

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