import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import vi from './locales/vi.json';
import zh from './locales/zh.json';

// Translation resources
export const resources = {
  en: { translation: en },
  vi: { translation: vi },
  zh: { translation: zh },
};

// Supported languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

// Get best available language
const getBestAvailableLanguage = (): string => {
  const phoneLocales = RNLocalize.getLocales();
  for (const locale of phoneLocales) {
    const languageTag = locale.languageTag.split('-')[0];
    if (resources[languageTag as keyof typeof resources]) {
      return languageTag;
    }
  }
  return 'en';
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: false,
  detect: getBestAvailableLanguage,
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;

// Helper to change language
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
};

// Helper to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};
