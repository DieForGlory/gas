import React, { useEffect, useState } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { subscriberService } from '../../services/api';
import { ArrowLeft, Server, History, Settings, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SubscriberView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscriber, setSubscriber] = useState(null);
  const { t } = useTranslation();

  const fetchSubscriber = async () => {
    try {
      const { data } = await subscriberService.getOne(id);
      setSubscriber(data);
    } catch (error) {
      navigate('/');
    }
  };

  useEffect(() => { fetchSubscriber(); }, [id]);

  if (!subscriber) return null;

  return (
    <div className="space-y-4 lg:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => navigate('/')} className="self-start sm:self-auto p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shrink-0">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-black text-slate-800 truncate">{subscriber.name}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Hash size={14} className="text-slate-400" />
            <p className="text-xs lg:text-sm font-mono font-bold text-blue-600 tracking-wide">{subscriber.account_number}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar bg-white rounded-xl border border-slate-200 px-2 sm:px-4">
        <div className="flex gap-4 sm:gap-6 min-w-max">
          <NavLink to="" end className={({isActive}) => `py-4 flex items-center gap-2 font-bold text-sm border-b-2 transition-colors ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Server size={18}/> {t('Устройства')}
          </NavLink>
          <NavLink to="logs" className={({isActive}) => `py-4 flex items-center gap-2 font-bold text-sm border-b-2 transition-colors ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <History size={18}/> {t('Журнал аудита')}
          </NavLink>
          <NavLink to="settings" className={({isActive}) => `py-4 flex items-center gap-2 font-bold text-sm border-b-2 transition-colors ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Settings size={18}/> {t('Управление данными')}
          </NavLink>
        </div>
      </div>

      <div className="py-2">
        <Outlet context={{ subscriber, refresh: fetchSubscriber }} />
      </div>
    </div>
  );
};
export default SubscriberView;