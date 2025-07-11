import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserSettings, AppSettings, DEFAULT_AI_SETTINGS } from '../../types';

// Données par défaut pour l'utilisateur principal
const defaultUser: User = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@example.com',
  avatar: '',
  phone: '',
  position: 'Administrateur',
  department: 'IT',
  role: 'admin',
  status: 'active',
  lastActive: new Date().toISOString(),
  settings: {
    theme: 'light',
    language: 'fr',
    timezone: 'Europe/Paris',
    notifications: true,
    emailNotifications: true,
  },
  isPrimary: true,
  cannotDelete: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface UserState {
  currentUser: User;
  users: User[];
  appSettings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: defaultUser,
  users: [defaultUser],
  appSettings: {
    theme: 'light',
    fontSize: 'medium',
    defaultView: 'today',
    itemsPerPage: 10,
    enableAnalytics: true,
    enableErrorReporting: true,
    aiSettings: DEFAULT_AI_SETTINGS,
    contacts: [],
  },
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    updateUserSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      state.currentUser.settings = { ...state.currentUser.settings, ...action.payload };
      // Mise à jour du thème dans appSettings si nécessaire
      if (action.payload.theme) {
        state.appSettings.theme = action.payload.theme;
      }
    },
    updateAppSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.appSettings = { ...state.appSettings, ...action.payload };
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
  setCurrentUser,
  updateUser,
  addUser,
  removeUser,
  updateUserSettings,
  updateAppSettings,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
