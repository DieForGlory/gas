import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  return (
    <div className="relative w-full">
      <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <select
        value={i18n.language || 'ru'}
        onChange={changeLanguage}
        className="w-full bg-slate-800 text-slate-300 border border-transparent rounded-xl pl-9 pr-3 py-2.5 outline-none text-sm font-medium focus:border-blue-500 transition-colors appearance-none cursor-pointer"
      >
        <option value="ru">Русский</option>
        <option value="uz_lat">O'zbekcha (Lat)</option>
        <option value="uz_cyr">Ўзбекча (Кир)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;