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
  isOnboarded: boolean;
  userToken: string | null;
  setIsOnboarded: (value: boolean) => Promise<void>;
  setLogin: (token: string, isNewUser?: boolean) => Promise<void>;
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
  isOnboarded: false,
  userToken: null,

  setIsOnboarded: async (value: boolean) => {
    await AsyncStorage.setItem('isOnboarded', value.toString());
    set({ isOnboarded: value });
  },

  setLogin: async (token: string, isNewUser: boolean = false) => {
    await AsyncStorage.setItem('userToken', token);
    const onboardValue = (!isNewUser).toString();
    await AsyncStorage.setItem('isOnboarded', onboardValue);
    set({ isLoggedIn: true, userToken: token, isOnboarded: !isNewUser });
  },

  setLogout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('isOnboarded');
    set({ isLoggedIn: false, userToken: null, isOnboarded: false });
  },

  checkLoginStatus: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const isOnboardedStr = await AsyncStorage.getItem('isOnboarded');
      if (token) {
        set({ 
          isLoggedIn: true, 
          userToken: token,
          isOnboarded: isOnboardedStr === 'true'
        });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
