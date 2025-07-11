import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';

interface TaskState {
  tasks: Record<string, Task[]>; // projectId -> Task[]
  selectedTask: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: {},
  selectedTask: null,
  isLoading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<{ projectId: string; tasks: Task[] }>) => {
      const { projectId, tasks } = action.payload;
      state.tasks[projectId] = tasks;
    },
    addTask: (state, action: PayloadAction<{ projectId: string; task: Task }>) => {
      const { projectId, task } = action.payload;
      if (!state.tasks[projectId]) {
        state.tasks[projectId] = [];
      }
      state.tasks[projectId].push(task);
    },
    updateTask: (state, action: PayloadAction<{ projectId: string; task: Task }>) => {
      const { projectId, task } = action.payload;
      if (state.tasks[projectId]) {
        const index = state.tasks[projectId].findIndex(t => t.id === task.id);
        if (index !== -1) {
          state.tasks[projectId][index] = task;
        }
      }
    },
    deleteTask: (state, action: PayloadAction<{ projectId: string; taskId: string }>) => {
      const { projectId, taskId } = action.payload;
      if (state.tasks[projectId]) {
        state.tasks[projectId] = state.tasks[projectId].filter(task => task.id !== taskId);
      }
    },
    setSelectedTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTask = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  setSelectedTask,
  setLoading,
  setError,
} = taskSlice.actions;

export default taskSlice.reducer;
