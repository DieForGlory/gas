import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { subscriberService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';

const SubscriberSettings = () => {
  const { t } = useTranslation();
  const { subscriber, refresh } = useOutletContext();

  const [formData, setFormData] = useState({
    name: subscriber.name,
    inn: subscriber.inn || '',
    address: subscriber.address,
    contact_person: subscriber.contact_person || '',
    phone: subscriber.phone || ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: subscriber.name,
      inn: subscriber.inn || '',
      address: subscriber.address,
      contact_person: subscriber.contact_person || '',
      phone: subscriber.phone || ''
    });
  }, [subscriber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subscriberService.update(subscriber.account_number, formData);
      await refresh();
      alert(t('success', 'Данные успешно обновлены'));
    } catch (error) {
      alert(t('registration_error', 'Ошибка при обновлении'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-3xl animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              {t('full_name_org_req', 'ФИО / Организация')}
            </label>
            <input
              required
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-800 text-sm"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              ИНН
            </label>
            <input
              required
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-bold text-slate-800 text-sm"
              value={formData.inn}
              onChange={e => setFormData({...formData, inn: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            {t('exact_address_req', 'Адрес')}
          </label>
          <input
            required
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 text-sm"
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              {t('contact_person', 'Контактное лицо')}
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 text-sm"
              value={formData.contact_person}
              onChange={e => setFormData({...formData, contact_person: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              {t('phone', 'Телефон')}
            </label>
            <input
              type="tel"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-medium text-slate-800 text-sm"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <Save size={18} />
            {loading ? t('processing', 'ОБРАБОТКА...') : t('register_button', 'Сохранить изменения')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriberSettings;