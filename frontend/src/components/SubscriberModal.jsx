import React, { useState } from 'react';
import { subscriberService } from '../services/api';
import { X, User, Phone, MapPin, Hash, UserCircle } from 'lucide-react';

const SubscriberModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    account_number: '',
    name: '',
    address: '',
    contact_person: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await subscriberService.create(formData);
      onSuccess(formData.account_number);
      onClose();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center p-8 border-b border-slate-50 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Регистрация абонента</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Все поля обязательны</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 shadow-sm"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Лицевой счет</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-bold text-slate-700" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Телефон</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono" placeholder="+79000000000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">ФИО / Организация</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Адрес объекта</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Контактное лицо</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Отмена</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? 'СОЗДАНИЕ...' : 'ЗАРЕГИСТРИРОВАТЬ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriberModal;