// frontend/src/components/SubscriberModal.jsx
import React, { useState, useEffect } from 'react';
import { subscriberService, geoService } from '../services/api';
import { X, User, Phone, MapPin, Hash, UserCircle, Map, Compass, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SubscriberModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    account_number: '',
    inn: '',
    name: '',
    address: '',
    contact_person: '',
    phone: '',
    district_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    geoService.getRegions()
      .then(res => setRegions(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      geoService.getDistricts(selectedRegion)
        .then(res => setDistricts(res.data))
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [selectedRegion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.district_id) {
      alert(t('error_select_district', 'Необходимо выбрать район'));
      return;
    }
    setLoading(true);
    try {
      await subscriberService.create(formData);
      onSuccess(formData.account_number);
      onClose();
    } catch (error) {
      alert(error.response?.data?.detail || t('registration_error', 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-8 border-b border-slate-50 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('subscriber_registration', 'Регистрация абонента')}</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{t('fill_details', 'Заполните данные')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 shadow-sm"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('account_number_req', 'Лицевой счет *')}</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-bold text-slate-700" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('phone', 'Телефон')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono" placeholder="+79000000000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('full_name_org_req', 'ФИО / Организация *')}</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">ИНН *</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-mono font-bold" value={formData.inn} onChange={e => setFormData({...formData, inn: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('region_req', 'Регион *')}</label>
              <div className="relative">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none"
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setFormData({...formData, district_id: ''});
                  }}
                >
                  <option value="" disabled>{t('select_option', 'Выберите...')}</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('district_req', 'Район *')}</label>
              <div className="relative">
                <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select
                  required
                  disabled={!selectedRegion}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none disabled:opacity-50"
                  value={formData.district_id}
                  onChange={e => setFormData({...formData, district_id: parseInt(e.target.value)})}
                >
                  <option value="" disabled>{t('select_option', 'Выберите...')}</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('exact_address_req', 'Точный адрес *')}</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('contact_person', 'Контактное лицо')}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:bg-white transition-all" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">{t('cancel', 'Отмена')}</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? t('creating', 'СОЗДАНИЕ...') : t('register_button', 'ЗАРЕГИСТРИРОВАТЬ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriberModal;