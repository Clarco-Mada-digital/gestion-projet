import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Project, Task, User, ViewMode, Theme } from '../types';

interface AppState {
  projects: Project[];
  users: User[];
  currentView: ViewMode;
  theme: Theme;
  selectedProject: string | null;
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
  | { type: 'SET_SELECTED_PROJECT'; payload: string | null };

const initialState: AppState = {
  projects: [],
  users: [
    { id: '1', name: 'Vous', email: 'vous@example.com', avatar: '👤' },
    { id: '2', name: 'Alice Martin', email: 'alice@example.com', avatar: '👩' },
    { id: '3', name: 'Bob Dupont', email: 'bob@example.com', avatar: '👨' },
    { id: '4', name: 'Clara Moreau', email: 'clara@example.com', avatar: '👩‍💼' }
  ],
  currentView: 'today',
  theme: 'dark',
  selectedProject: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload)
      };
    case 'ADD_TASK':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, tasks: [...p.tasks, action.payload.task] }
            : p
        )
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        projects: state.projects.map(p => ({
          ...p,
          tasks: p.tasks.map(t => t.id === action.payload.id ? action.payload : t)
        }))
      };
    case 'DELETE_TASK':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, tasks: p.tasks.filter(t => t.id !== action.payload.taskId) }
            : p
        )
      };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('astroProjectManagerData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        dispatch({ type: 'SET_PROJECTS', payload: data.projects || [] });
        dispatch({ type: 'SET_THEME', payload: data.theme || 'dark' });
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    } else {
      // Initialize with sample data
      const sampleProjects: Project[] = [
        {
          id: '1',
          name: 'Site Web E-commerce',
          description: 'Développement d\'un site e-commerce moderne avec Astro.js',
          color: '#0EA5E9',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [
            {
              id: '1',
              title: 'Design de l\'interface utilisateur',
              description: 'Créer les maquettes et prototypes avec Figma',
              status: 'done',
              priority: 'high',
              dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              assignees: ['1', '2'],
              projectId: '1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['design', 'ui/ux', 'figma']
            },
            {
              id: '2',
              title: 'Intégration des paiements Stripe',
              description: 'Configurer Stripe et les méthodes de paiement sécurisées',
              status: 'in-progress',
              priority: 'high',
              dueDate: new Date().toISOString(),
              assignees: ['1'],
              projectId: '1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['backend', 'paiement', 'stripe']
            },
            {
              id: '3',
              title: 'Optimisation SEO avec Astro',
              description: 'Améliorer le référencement naturel et les performances',
              status: 'todo',
              priority: 'medium',
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              assignees: ['3'],
              projectId: '1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['seo', 'performance', 'astro']
            }
          ]
        },
        {
          id: '2',
          name: 'Application Mobile React Native',
          description: 'Application mobile cross-platform avec React Native',
          color: '#8B5CF6',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: [
            {
              id: '4',
              title: 'Authentification utilisateur',
              description: 'Système de connexion et inscription sécurisé',
              status: 'todo',
              priority: 'high',
              dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              assignees: ['2', '4'],
              projectId: '2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['auth', 'mobile', 'react-native']
            }
          ]
        }
      ];
      dispatch({ type: 'SET_PROJECTS', payload: sampleProjects });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('astroProjectManagerData', JSON.stringify({
      projects: state.projects,
      theme: state.theme
    }));
  }, [state.projects, state.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

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