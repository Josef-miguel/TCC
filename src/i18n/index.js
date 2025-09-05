import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Recursos de tradução
import en from './locales/en.json';
import pt from './locales/pt-BR.json';
import zh from './locales/zh-CN.json';

// Configuração de linguagem
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('@app_language');
      callback(savedLanguage || 'pt');
    } catch (error) {
      callback('pt');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('@app_language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      zh: { translation: zh }
    },
    fallbackLng: 'pt',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;