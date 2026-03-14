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
  hasSeenTutorial: boolean;
  userToken: string | null;
  user: any | null;
  setUser: (user: any) => Promise<void>;
  loveRequests: any[];
  setLoveRequests: (requests: any[]) => void;
  addLoveRequest: (request: any) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  setIsOnboarded: (value: boolean) => Promise<void>;
  setHasSeenTutorial: (value: boolean) => Promise<void>;
  setLogin: (token: string, isNewUser?: boolean, user?: any) => Promise<void>;
  setLogout: () => Promise<void>;
  checkLoginStatus: () => Promise<void>;
  activeTab: any;
  setActiveTab: (tab: any) => void;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
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
  hasSeenTutorial: false,
  userToken: null,
  user: null,
  setUser: async (user: any) => {
    console.log('[appStore] Updating User State to:', JSON.stringify(user));
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('user');
    }
    set({ user });
  },
  loveRequests: [],
  setLoveRequests: (requests: any[]) => set({ loveRequests: requests }),
  addLoveRequest: (request: any) => set(state => ({ 
    loveRequests: [request, ...state.loveRequests] 
  })),
  notification: null,
  setNotification: (msg: string | null) => set({ notification: msg }),

  setIsOnboarded: async (value: boolean) => {
    await AsyncStorage.setItem('isOnboarded', value.toString());
    set({ isOnboarded: value });
  },

  setHasSeenTutorial: async (value: boolean) => {
    await AsyncStorage.setItem('hasSeenTutorial', value.toString());
    set({ hasSeenTutorial: value });
  },

  setLogin: async (token: string, isNewUser: boolean = false, user: any = null) => {
    await AsyncStorage.setItem('userToken', token);
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    const onboardValue = (!isNewUser).toString();
    await AsyncStorage.setItem('isOnboarded', onboardValue);
    
    if (isNewUser) {
      await AsyncStorage.setItem('hasSeenTutorial', 'false');
      set({ isLoggedIn: true, userToken: token, user, isOnboarded: false, hasSeenTutorial: false });
    } else {
      await AsyncStorage.setItem('hasSeenTutorial', 'true');
      set({ isLoggedIn: true, userToken: token, user, isOnboarded: true, hasSeenTutorial: true });
    }
  },

  setLogout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('isOnboarded');
    await AsyncStorage.removeItem('user');
    set({ isLoggedIn: false, userToken: null, user: null, isOnboarded: false });
  },

  checkLoginStatus: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const isOnboardedStr = await AsyncStorage.getItem('isOnboarded');
      const hasSeenTutorialStr = await AsyncStorage.getItem('hasSeenTutorial');
      const userStr = await AsyncStorage.getItem('user');
      const storedUser = userStr ? JSON.parse(userStr) : null;
      console.log('[appStore] checkLoginStatus - stored user:', storedUser);
      if (token) {
        set({ 
          isLoggedIn: true, 
          userToken: token,
          user: storedUser,
          isOnboarded: isOnboardedStr === 'true',
          hasSeenTutorial: hasSeenTutorialStr === 'true'
        });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      set({ isInitialized: true });
    }
  },
  activeTab: 'home',
  setActiveTab: (tab: string) => set({ activeTab: tab }),
  conversationId: null,
  setConversationId: (id: string | null) => set({ conversationId: id }),
}));
