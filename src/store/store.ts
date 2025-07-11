import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, TypedUseSelectorHook, useSelector } from 'react-redux';
import projectsReducer from './slices/projectsSlice';
import settingsReducer from './slices/settingsSlice';
import userReducer from './slices/userSlice';
import taskReducer from './slices/taskSlice';

// Configuration du store Redux
export const store = configureStore({
  reducer: {
    user: userReducer,
    projects: projectsReducer,
    tasks: taskReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks personnalisés pour une utilisation simplifiée
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
