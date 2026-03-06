// import { create } from 'zustand';
// import { changeLanguage, getCurrentLanguage } from '@i18n';

// type Theme = 'light' | 'dark' | 'system';

// interface AppState {
//   language: string;
//   setLanguage: (lang: string) => void;

//   theme: Theme;
//   setTheme: (theme: Theme) => void;

//   isInitialized: boolean;
//   setIsInitialized: (value: boolean) => void;
// }

// export const useAppStore = create<AppState>(set => ({
//   language: getCurrentLanguage(),
//   setLanguage: (lang: string) => {
//     changeLanguage(lang);
//     set({ language: lang });
//   },

//   theme: 'system',
//   setTheme: (theme: Theme) => set({ theme }),

//   isInitialized: false,
//   setIsInitialized: (value: boolean) => set({ isInitialized: value }),
// }));
import { create } from 'zustand';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  language: string;
  setLanguage: (lang: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  userToken: string | null;
  setLogin: (token: string) => Promise<void>;
  setLogout: () => Promise<void>;
  checkLoginStatus: () => Promise<void>;
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
  isLoggedIn: false,
  setIsLoggedIn: value => set({ isLoggedIn: value }),
  userToken: null,

  setLogin: async (token: string) => {
    await AsyncStorage.setItem('userToken', token);
    set({ isLoggedIn: true, userToken: token });
  },

  setLogout: async () => {
    await AsyncStorage.removeItem('userToken');
    set({ isLoggedIn: false, userToken: null });
  },

  checkLoginStatus: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        set({ isLoggedIn: true, userToken: token });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
