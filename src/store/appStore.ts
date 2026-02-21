import { create } from 'zustand';
import { changeLanguage, getCurrentLanguage } from '@i18n';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  // Language
  language: string;
  setLanguage: (lang: string) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // App state
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
}

export const useAppStore = create<AppState>(set => ({
  language: getCurrentLanguage(),
  setLanguage: (lang: string) => {
    changeLanguage(lang);
    set({ language: lang });
  },

  theme: 'system',
  setTheme: (theme: Theme) => set({ theme }),

  isInitialized: false,
  setIsInitialized: (value: boolean) => set({ isInitialized: value }),
}));
