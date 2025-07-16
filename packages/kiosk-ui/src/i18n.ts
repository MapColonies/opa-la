import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json' with { type: 'json' };
import he from './translations/he.json' with { type: 'json' };

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: en,
  },
  he: {
    translation: he,
  },
} satisfies Resource;

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem('kiosk-ui-language') || 'he', // Default to Hebrew, store preference in localStorage
    fallbackLng: 'en', // Fallback to English if translation is missing
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })
  .then(() => {
    // Set initial language and font based on the current language
    const currentLanguage = i18n.language;
    document.documentElement.lang = currentLanguage;

    // Set page title based on translation
    const pageTitle = i18n.t('page.title');
    if (pageTitle) {
      document.title = pageTitle;
    }

    // Apply appropriate font family
    if (currentLanguage === 'he') {
      document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '') + ' font-hebrew';
    } else {
      document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '') + ' font-sans';
    }
  });

// Listen for language changes and update the page title
if (i18n && typeof i18n.on === 'function') {
  i18n.on('languageChanged', (lng) => {
    const pageTitle = i18n.t('page.title');
    if (pageTitle) {
      document.title = pageTitle;
    }
  });
}

export default i18n;
