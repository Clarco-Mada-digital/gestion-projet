import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, EmailSettings } from '../types';

const initialState: SettingsState = {
  email: {
    serviceId: '',
    templateId: '',
    publicKey: '',
    toEmail: '',
  },
  theme: 'light',
  language: 'fr',
  isInitialized: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setEmailSettings: (state, action: PayloadAction<EmailSettings>) => {
      state.email = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    initializeSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload, isInitialized: true };
    },
  },
});

export const {
  setEmailSettings,
  setTheme,
  setLanguage,
  initializeSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
