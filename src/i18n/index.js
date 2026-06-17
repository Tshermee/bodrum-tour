import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import tr from './locales/tr.json'
import fr from './locales/fr.json'
import de from './locales/de.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, tr: { translation: tr }, fr: { translation: fr }, de: { translation: de } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr', 'fr', 'de'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'bodrum-lang',
    },
    interpolation: { escapeValue: false },
  })

export default i18n
