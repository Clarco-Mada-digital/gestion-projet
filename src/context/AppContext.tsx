import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Project, Task, User, UserSettings, ViewMode, Theme, EmailSettings, AppSettings, DEFAULT_AI_SETTINGS, FontSize } from '../types';

interface AppState {
  projects: Project[];
  users: User[];
  theme: 'light' | 'dark';
  currentView: string;
  emailSettings: EmailSettings;
  appSettings: AppSettings;
  notifications: any[];
  isLoading: boolean;
  error: string | null;
  selectedProject: string | null;
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
  | { type: 'EXPORT_DATA' };

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

// Données d'exemple pour les autres utilisateurs
const exampleUsers: User[] = [
  {
    id: '2',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    avatar: '',
    phone: '+261 34 00 000 01',
    position: 'Chef de projet',
    department: 'Gestion de projet',
    role: 'member' as const,
    status: 'active' as const,
    lastActive: new Date().toISOString(),
    settings: {
      theme: 'light',
      language: 'fr',
      timezone: 'Europe/Paris',
      notifications: true,
      emailNotifications: true,
      pushNotifications: true,
      daysOff: ['saturday', 'sunday']
    } as UserSettings,
    isPrimary: false,
    cannotDelete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    avatar: '',
    phone: '+261 34 00 000 02',
    position: 'Développeuse',
    department: 'Développement',
    role: 'member' as const,
    status: 'active' as const,
    lastActive: new Date().toISOString(),
    settings: {
      theme: 'dark',
      language: 'fr',
      timezone: 'Indian/Antananarivo',
      notifications: true,
      emailNotifications: true,
      pushNotifications: true
    } as UserSettings,
    isPrimary: false,
    cannotDelete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Paul Durand',
    email: 'paul.durand@example.com',
    phone: '+261 34 00 000 03',
    position: 'Designer UX/UI',
    department: 'Design',
    role: 'viewer',
    status: 'active',
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
    avatar: '',
    isPrimary: false,
    cannotDelete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];



// Données d'exemple pour les projets
const exampleProjects: Project[] = [
  {
    id: 'p1',
    name: 'Application Mobile',
    description: 'Développement de l\'application mobile principale',
    color: '#3b82f6',
    status: 'active',
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-06-20').toISOString(),
    tasks: [
      {
        id: 't1',
        title: 'Concevoir les maquettes',
        description: 'Créer les maquettes pour les écrans principaux',
        status: 'done',
        priority: 'high',
        dueDate: new Date('2023-02-15').toISOString(),
        startDate: new Date('2023-01-16').toISOString(),
        endDate: new Date('2023-02-10').toISOString(),
        assignees: ['4'], // Paul Durand (Designer)
        projectId: 'p1',
        createdAt: new Date('2023-01-16').toISOString(),
        updatedAt: new Date('2023-02-10').toISOString(),
        completedAt: new Date('2023-02-10').toISOString(),
        tags: ['design', 'ui/ux'],
        subTasks: [
          {
            id: 'st1',
            title: 'Maquette écran de connexion',
            completed: true,
            createdAt: new Date('2023-01-16').toISOString(),
            updatedAt: new Date('2023-01-20').toISOString()
          }
        ]
      },
      {
        id: 't2',
        title: 'Implémenter l\'authentification',
        description: 'Développer le système de connexion/inscription',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date('2023-03-10').toISOString(),
        startDate: new Date('2023-02-15').toISOString(),
        endDate: new Date('2023-03-10').toISOString(),
        assignees: ['3'], // Marie Martin
        projectId: 'p1',
        createdAt: new Date('2023-02-01').toISOString(),
        updatedAt: new Date('2023-02-15').toISOString(),
        tags: ['backend', 'auth'],
        subTasks: [],
        estimatedHours: 16
      }
    ]
  },
  {
    id: 'p2',
    name: 'Site Web Corporate',
    description: 'Refonte du site web de l\'entreprise',
    color: '#10b981',
    status: 'active',
    createdAt: new Date('2023-02-01').toISOString(),
    updatedAt: new Date('2023-06-18').toISOString(),
    tasks: [
      {
        id: 't3',
        title: 'Mise à jour du contenu',
        description: 'Actualiser les textes et images du site',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2023-07-15').toISOString(),
        startDate: new Date('2023-06-01').toISOString(),
        endDate: new Date('2023-07-15').toISOString(),
        assignees: ['2'], // Jean Dupont
        projectId: 'p2',
        createdAt: new Date('2023-06-01').toISOString(),
        updatedAt: new Date('2023-06-01').toISOString(),
        tags: ['contenu', 'seo'],
        subTasks: []
      }
    ]
  }
];


// Paramètres par défaut de l'application
const initialAppSettings: AppSettings = {
  theme: 'light',
  fontSize: 'medium',
  defaultView: 'today',
  itemsPerPage: 10,
  enableAnalytics: false,
  enableErrorReporting: false,
  aiSettings: DEFAULT_AI_SETTINGS
};

const initialState: AppState = {
  projects: [],
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
  theme: 'light',
  currentView: 'today',
  emailSettings: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    useSSL: false,
    useTLS: true
  },
  appSettings: initialAppSettings,
  notifications: [],
  isLoading: false,
  error: null,
  selectedProject: null
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };
    case 'ADD_TASK':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                tasks: [...(project.tasks || []), action.payload.task],
              }
            : project
        ),
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (!project.tasks) return project;
          return {
            ...project,
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
            }),
          };
        }),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id !== action.payload.projectId) return project;
          return {
            ...project,
            tasks: (project.tasks || []).filter(
              task => task.id !== action.payload.taskId
            ),
          };
        }),
      };
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
    case 'UPDATE_EMAIL_SETTINGS':
      return {
        ...state,
        emailSettings: { ...state.emailSettings, ...action.payload }
      };
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
    case 'INIT_STATE':
      const { users, ...rest } = action.payload;
      // S'assurer qu'il y a toujours au moins un utilisateur
      const validUsers = users && users.length > 0 ? users : [defaultUser];
      return { ...state, ...rest, users: validUsers };
    case 'IMPORT_DATA':
      try {
        const data = action.payload;
        // S'assurer que les champs requis existent
        if (!data.projects || !data.users) {
          throw new Error("Données d'importation invalides");
        }
        
        return {
          ...state,
          projects: data.projects || [],
          users: data.users || [],
          theme: data.theme || 'light',
          emailSettings: data.emailSettings || {},
          appSettings: data.appSettings || {},
        };
      } catch (error) {
        console.error("Erreur lors de l'importation des données:", error);
        return { ...state, error: "Erreur lors de l'importation des données" };
      }
    case 'EXPORT_DATA':
      // L'exportation est gérée dans le composant, cette action ne modifie pas l'état
      return state;
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

  // Effet pour charger les données initiales
  useEffect(() => {
    console.log('Chargement des données initiales...');
    
    const loadInitialData = async () => {
      try {
        const savedData = localStorage.getItem('astroProjectManagerData');
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Données chargées depuis le localStorage:', parsedData);
          
          // S'assurer qu'il y a au moins un utilisateur
          const users = parsedData.users && parsedData.users.length > 0 
            ? parsedData.users 
            : [defaultUser];

          // Vérification que la vue est valide
          const validViews: ViewMode[] = ['today', 'projects', 'kanban', 'calendar', 'settings'];
          const viewToSet = parsedData.currentView || 'today';
          
          console.log('Vue à appliquer:', viewToSet);
          console.log('Est-ce une vue valide?', validViews.includes(viewToSet));
          
          // Mettre à jour l'état avec les données chargées
          dispatch({
            type: 'INIT_STATE',
            payload: {
              ...parsedData,
              users,
              currentView: validViews.includes(viewToSet) ? viewToSet : 'today'
            }
          });

          console.log('Données initiales chargées avec succès');
        } else {
          console.log('Aucune donnée sauvegardée trouvée, utilisation des valeurs par défaut');
          // Utiliser les valeurs par défaut avec des exemples
          dispatch({
            type: 'INIT_STATE',
            payload: {
              ...initialState,
              users: [defaultUser, ...exampleUsers],
              projects: exampleProjects
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // En cas d'erreur, utiliser les valeurs par défaut
        dispatch({
          type: 'INIT_STATE',
          payload: {
            ...initialState,
            users: [defaultUser, ...exampleUsers],
            projects: exampleProjects
          }
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();
  }, []);

  // Effet pour sauvegarder les données dans le localStorage
  useEffect(() => {
    if (state.isLoading) return; // Ne pas sauvegarder pendant le chargement initial
    
    try {
      console.log('Sauvegarde des données dans le localStorage...');
      
      // Préparer les données à sauvegarder
      const { isLoading, error, notifications, ...dataToSave } = state;
      
      localStorage.setItem('astroProjectManagerData', JSON.stringify({
        ...dataToSave,
        // S'assurer que les notifications ne sont pas sauvegardées
        notifications: []
      }));
      
      console.log('Données sauvegardées avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  }, [state]);

  // Appliquer le thème
  useEffect(() => {
    const theme = state.theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Sauvegarder le thème dans le localStorage pour la persistance
    // entre les rechargements de page
    localStorage.setItem('astroProjectManagerTheme', theme);
  }, [state.theme]);
  
  // Effet pour charger le thème au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('astroProjectManagerTheme') as Theme | null;
    if (savedTheme && savedTheme !== state.theme) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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