import { Project, Task, AISettings } from '../types';
import { AnyAction, ThunkAction, ThunkDispatch } from '@reduxjs/toolkit';

// État des projets
export interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Paramètres email
export interface EmailSettings {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
}

// État des paramètres
export interface SettingsState {
  email: EmailSettings;
  theme: 'light' | 'dark';
  language: string;
  isInitialized: boolean;
  aiSettings: AISettings;
}

// État global de l'application
export interface TasksState {
  tasks: Task[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  appSettings: {
    aiSettings: AISettings;
    // Ajoutez d'autres paramètres ici si nécessaire
  };
}

export interface RootState {
  projects: ProjectsState;
  settings: SettingsState;
  tasks: TasksState;
  // Ajoutez d'autres états ici si nécessaire
}

// Type pour le dispatch avec support des thunks
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>;

// Type pour le dispatch typé
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

// Type pour les sélecteurs
export type Selector<T> = (state: RootState) => T;
