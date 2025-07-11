import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from './store';
import { setLoading, setError } from './slices/userSlice';
import { setProjects } from './slices/projectsSlice';
import { setTasks } from './slices/taskSlice';
import { Project, Task } from '../types';

// Thunk pour charger les données initiales
export const initializeApp = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: RootState }
>('app/initialize', async (_, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    
    // Simuler un chargement asynchrone
    const [projects, tasks] = await Promise.all([
      // Remplacer par un appel API réel
      new Promise<Project[]>((resolve) => 
        setTimeout(() => resolve([]), 500)
      ),
      new Promise<Record<string, Task[]>>((resolve) => 
        setTimeout(() => resolve({}), 500)
      ),
    ]);

    dispatch(setProjects(projects));
    
    // Ajouter les tâches par projet
    Object.entries(tasks).forEach(([projectId, projectTasks]) => {
      dispatch(setTasks({ projectId, tasks: projectTasks }));
    });
    
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Une erreur est survenue'));
  } finally {
    dispatch(setLoading(false));
  }
});

// Autres thunks peuvent être ajoutés ici
// Par exemple :
// - fetchProjectById
// - createNewProject
// - updateProjectTasks
// - etc.
