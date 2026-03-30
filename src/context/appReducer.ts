import { AppState, AppAction, Project, Task, SubTask, UserSettings, User } from '../types';
import { defaultUser } from './initialState';

/**
 * Normalise une sous-tâche ancienne ou incomplète vers le format actuel.
 * IMPORTANT: on part de {...st} pour préserver TOUS les champs, même ceux inconnus.
 */
const migrateSubTask = (st: any): SubTask => {
  const now = new Date().toISOString();
  return {
    // Préserver tous les champs existants d'abord
    ...st,
    // Puis normaliser/corriger les champs obligatoires ou mal typés
    id: st.id || `subtask-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: st.title || st.name || '',
    completed: typeof st.completed === 'boolean' ? st.completed : (st.done ?? false),
    createdAt: st.createdAt || now,
    updatedAt: st.updatedAt || st.createdAt || now,
  };
};

/**
 * Normalise une tâche ancienne ou incomplète vers le format actuel.
 * IMPORTANT: on part de {...task} pour préserver TOUS les champs, même ceux inconnus.
 */
const migrateTask = (task: any): Task => {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // Normaliser les sous-tâches (peut être undefined, null, ou dans un ancien format)
  let subTasks: SubTask[] = [];
  if (Array.isArray(task.subTasks)) {
    subTasks = task.subTasks.map(migrateSubTask);
  } else if (Array.isArray(task.subtasks)) {
    // Ancien format avec "subtasks" en minuscule
    subTasks = task.subtasks.map(migrateSubTask);
  } else if (Array.isArray(task.checkpoints)) {
    // Ancien format "checkpoints"
    subTasks = task.checkpoints.map(migrateSubTask);
  }

  return {
    // Préserver TOUS les champs existants d'abord (custom fields inclus)
    ...task,
    // Puis normaliser/corriger uniquement les champs obligatoires manquants
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: task.title || task.name || '',
    description: task.description || '',
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    startDate: task.startDate || task.start_date || today,
    dueDate: task.dueDate || task.due_date || today,
    assignees: Array.isArray(task.assignees) ? task.assignees : [],
    projectId: task.projectId || task.project_id || '',
    createdAt: task.createdAt || task.created_at || now,
    updatedAt: task.updatedAt || task.updated_at || now,
    tags: Array.isArray(task.tags) ? task.tags : [],
    subTasks, // toujours un tableau (migré)
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
  };
};

/**
 * Normalise un projet et toutes ses tâches vers le format actuel.
 * IMPORTANT: on part de {...project} pour préserver TOUS les champs, même ceux inconnus.
 */
const migrateProject = (project: any): Project => {
  const tasks = Array.isArray(project.tasks)
    ? project.tasks.map(migrateTask)
    : [];
  return {
    // Préserver tous les champs existants d'abord
    ...project,
    tasks,
    // Normaliser uniquement les champs obligatoires manquants
    description: project.description ?? '',
    color: project.color || '#0EA5E9',
    status: project.status || 'active',
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
  };
};

// Fonction utilitaire pour extraire toutes les tâches des projets
export const extractAllTasks = (projects: Project[]): Task[] => {
  return projects.flatMap(project => project.tasks || []);
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
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
      const userExists = state.users.some(user => user.email === action.payload.email);
      if (userExists) {
        console.warn('Un utilisateur avec cet email existe déjà');
        return state;
      }
      const now = new Date().toISOString();
      const defaultUserSettings: UserSettings = {
        theme: 'light',
        language: 'fr',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: true,
        emailNotifications: true,
        pushNotifications: true,
        daysOff: ['saturday', 'sunday']
      };
      const userSettings: UserSettings = {
        ...defaultUserSettings,
        ...(action.payload.settings || {})
      };
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
      if (action.payload === state.users[0]?.id) {
        console.warn('Impossible de supprimer l\'utilisateur principal');
        return state;
      }
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      };
    case 'UPDATE_EMAIL_SETTINGS': {
      const updatedSettings = {
        ...state.emailSettings,
        ...action.payload,
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
            // On part des settings existants de l'utilisateur (sans hardcoder de valeurs par défaut
            // qui écraserait les préférences sauvegardées)
            ...user.settings,
            // On applique ensuite les nouvelles valeurs de l'action
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
      const { users, reports, visionDossiers, projects: rawProjects, ...rest } = action.payload;
      const validUsers = users && users.length > 0 ? users : [defaultUser];
      const validReports = reports || [];
      // Migrer tous les projets sauvegardés vers le format actuel (compatibilité ascendante)
      const validProjects: Project[] = Array.isArray(rawProjects)
        ? rawProjects.map(migrateProject)
        : [];
      const validVisionDossiers = (visionDossiers || []).map((d: any) => ({
        ...d,
        description: d.description || '',
        objectives: d.objectives || '',
        targetAudience: d.targetAudience || '',
        features: d.features || '',
        constraints: d.constraints || '',
        summaryData: d.summaryData || {
          complexity: 'Moyenne',
          techStack: 'Standards Web',
          duration: 'À estimer',
          budget: 'À définir'
        }
      }));
      return {
        ...state,
        ...rest,
        projects: validProjects,
        tasks: extractAllTasks(validProjects),
        users: validUsers,
        reports: validReports,
        visionDossiers: validVisionDossiers
      };
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
            // Partir des settings existants sans écraser avec des valeurs hardcodées
            ...user.settings,
            accentColor: action.payload
          } as UserSettings
        }))
      };
    case 'ADD_VISION_DOSSIER':
      return {
        ...state,
        visionDossiers: [action.payload, ...state.visionDossiers]
      };
    case 'DELETE_VISION_DOSSIER':
      return {
        ...state,
        visionDossiers: state.visionDossiers.filter(d => d.id !== action.payload)
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
        if (!data.projects || !data.users) {
          throw new Error("Données d'importation invalides");
        }
        const importedProjects = (data.projects || state.projects).map(migrateProject);
        return {
          ...state,
          projects: importedProjects,
          tasks: extractAllTasks(importedProjects),
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
      return state;
    case 'SET_CLOUD_USER': {
      if (state.cloudUser?.uid === action.payload?.uid) return state;
      return { ...state, cloudUser: action.payload };
    }
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
      // Migrer les projets entrant du Cloud pour compatibilité
      const incomingProjects = action.payload.map(migrateProject);
      const incomingIds = new Set(incomingProjects.map(p => p.id));
      const localOnlyProjects = state.projects.filter(p => p.source !== 'firebase');
      // Fusionner les projets Firebase entrants avec l'état local
      const mergedFirebaseProjects = incomingProjects.map(incoming => {
        const local = state.projects.find(p => p.id === incoming.id);
        
        if (local && local.source === 'firebase') {
          // PROTECTION CRITIQUE : Si le Cloud renvoie ZERO tâches (souvent cause Quota ou v2 non chargé)
          // alors que nous en avons localement, on GARDE les locales envers et contre tout.
          const incomingHasNoTasks = !incoming.tasks || incoming.tasks.length === 0;
          const localHasTasks = local.tasks && local.tasks.length > 0;
          
          if (incomingHasNoTasks && localHasTasks) {
            console.log(`[Sync Guard] Conservation des tâches locales pour ${incoming.name} (Cloud vide)`);
            incoming = { ...incoming, tasks: local.tasks };
          }

          // Résolution de conflit par date uniquement si on n'est pas dans un cas de "vidage" Cloud
          if (new Date(local.updatedAt) > new Date(incoming.updatedAt)) {
            return {
              ...incoming,
              ...local,
              tasks: local.tasks // Primauté aux tâches locales en cas de doute
            };
          }
        }
        return incoming;
      });
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
      if (updatedProjects.length === state.projects.length) {
        const isIdentical = updatedProjects.every((p, idx) => {
          const prev = state.projects[idx];
          return p.id === prev.id && p.updatedAt === prev.updatedAt && (p.tasks?.length === prev.tasks?.length);
        });
        if (isIdentical) return state;
      }
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
