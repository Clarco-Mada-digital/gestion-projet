import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types';

export interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProjectId: null,
  status: 'idle',
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.push(action.payload);
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(project => project.id !== action.payload);
    },
    setCurrentProject: (state, action: PayloadAction<string | null>) => {
      state.currentProjectId = action.payload;
    },
    setStatus: (state, action: PayloadAction<ProjectsState['status']>) => {
      state.status = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setProjects,
  addProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  setStatus,
  setError,
} = projectsSlice.actions;

export default projectsSlice.reducer;
