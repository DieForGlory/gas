import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { subscriberService } from '../../services/api';
import { Save, Building2, MapPin, User, Phone, FileText, AlertCircle } from 'lucide-react';

const SubscriberSettings = () => {
  // Получаем абонента и функцию обновления из родительского компонента SubscriberView
  const { subscriber, refresh } = useOutletContext();

  const [formData, setFormData] = useState({
    name: subscriber?.name || '',
    inn: subscriber?.inn || '',
    address: subscriber?.address || '',
    contact_person: subscriber?.contact_person || '',
    phone: subscriber?.phone || '',
    contract_status: subscriber?.contract_status || 'ACTIVE'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (subscriber) {
      setFormData({
        name: subscriber.name || '',
        inn: subscriber.inn || '',
        address: subscriber.address || '',
        contact_person: subscriber.contact_person || '',
        phone: subscriber.phone || '',
        contract_status: subscriber.contract_status || 'ACTIVE'
      });
    }
  }, [subscriber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // Используем account_number вместо id
      await subscriberService.update(subscriber.account_number, formData);
      setMessage({ type: 'success', text: 'Настройки успешно обновлены' });
      if (refresh) refresh(); // Обновляем глобальные данные абонента
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Ошибка сохранения данных'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subscriber) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
          <Building2 size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Настройки абонента</h2>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
              Наименование (ФИО)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                required
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 font-semibold text-slate-700 transition-colors"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
              ИНН
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 font-semibold text-slate-700 transition-colors"
                value={formData.inn}
                onChange={e => setFormData({...formData, inn: e.target.value})}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
              Адрес объекта
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 font-semibold text-slate-700 transition-colors"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
              Контактное лицо
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 font-semibold text-slate-700 transition-colors"
                value={formData.contact_person}
                onChange={e => setFormData({...formData, contact_person: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
              Телефон
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 font-semibold text-slate-700 transition-colors"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            Статус обслуживания
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold text-slate-800 text-sm appearance-none cursor-pointer"
            value={formData.contract_status}
            onChange={e => setFormData({...formData, contract_status: e.target.value})}
          >
            <option value="ACTIVE">Активен (Виден всем)</option>
            <option value="SUSPENDED">Приостановлен (Скрыт от Level 2/3)</option>
          </select>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {loading ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ ИЗМЕНЕНИЯ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriberSettings;