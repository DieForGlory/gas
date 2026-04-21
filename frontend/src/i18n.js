import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импорт обновленных JSON-файлов локализации
import ru from './locales/ru.json';
import uzLat from './locales/uz_lat.json';
import uzCyr from './locales/uz_cyr.json';

// Конфигурация ресурсов: ключи (ru, uz_lat, uz_cyr) должны строго совпадать
// со значениями в LanguageSwitcher
const resources = {
  ru: { translation: ru },
  uz_lat: { translation: uzLat },
  uz_cyr: { translation: uzCyr }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    // Приоритет выбора языка: сохраненный в localStorage -> по умолчанию 'ru'
    lng: localStorage.getItem('app_lang') || 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false // React автоматически защищает от XSS
    }
  });

export default i18n;