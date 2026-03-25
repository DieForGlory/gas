import React, { useState } from 'react';
import { deviceService } from '../services/api';
import { X } from 'lucide-react';

const DeviceModal = ({ subscriberAccount, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ imei: '', subscriber_account: subscriberAccount, valve_type: 0 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await deviceService.register(formData);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка регистрации устройства');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Регистрация устройства</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">IMEI устройства (15 цифр)</label>
            <input
              required
              type="text"
              minLength={15}
              maxLength={15}
              pattern="\d{15}"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
              value={formData.imei}
              onChange={e => setFormData({...formData, imei: e.target.value.replace(/\D/g, '')})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Тип клапана</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-700" value={formData.valve_type} onChange={e => setFormData({...formData, valve_type: parseInt(e.target.value)})}>
              <option value={0}>Chint (Импульсный)</option>
              <option value={1}>H-Bridge (Моторный)</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">Добавить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceModal;