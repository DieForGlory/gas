import React, { useState, useEffect } from 'react';
import { deviceService, valveTypeService } from '../services/api';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DeviceModal = ({ subscriberAccount, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ imei: '', subscriber_account: subscriberAccount, valve_type: '' });
  const [loading, setLoading] = useState(false);
  const [valveTypes, setValveTypes] = useState([]);

  useEffect(() => {
    valveTypeService.getAll().then(res => {
      setValveTypes(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, valve_type: res.data[0].id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.valve_type === '' || formData.valve_type === undefined) {
        return alert('Создайте тип клапана в панели администратора');
    }
    setLoading(true);
    try {
      await deviceService.register(formData);
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.detail || t('device_reg_error', 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{t('device_reg_title', 'Регистрация устройства')}</h3>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('device_imei_15', 'IMEI устройства')}</label>
            <input required type="text" minLength={15} maxLength={15} pattern="\d{15}" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-mono" value={formData.imei} onChange={e => setFormData({...formData, imei: e.target.value.replace(/\D/g, '')})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t('valve_type', 'Тип клапана')}</label>
            <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-semibold text-slate-700" value={formData.valve_type} onChange={e => setFormData({...formData, valve_type: parseInt(e.target.value)})}>
              {valveTypes.map(vt => (
                <option key={vt.id} value={vt.id}>{vt.name} ({vt.response_time} мс)</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl">{t('cancel', 'Отмена')}</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">{t('add_button', 'Добавить')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default DeviceModal;