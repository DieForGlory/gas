import React, { useEffect, useState, useCallback } from 'react';
import { adminService } from '../services/api';
import { History, Clock, User, Hash, Search, FilterX, ListFilter, Loader2, Users, HardDrive, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Audit = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'subscribers', 'devices'

  const [operatorId, setOperatorId] = useState('');
  const [imei, setImei] = useState('');
  const [actionQuery, setActionQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tab: activeTab,
        operator_id: operatorId || undefined,
        imei: activeTab === 'devices' ? (imei || undefined) : undefined,
        action_query: actionQuery || undefined
      };
      const { data } = await adminService.getAuditLogs(params);
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, operatorId, imei, actionQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setOperatorId('');
    setImei('');
    setActionQuery('');
    adminService.getAuditLogs({ tab: activeTab }).then(({ data }) => setLogs(data));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setOperatorId('');
    setImei('');
    setActionQuery('');
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 p-2.5 rounded-xl">
          <History className="text-white" size={24} />
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{t('audit_log')}</h2>
      </div>

      {/* Навигация по вкладкам */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'users' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
        >
          <Users size={18} /> {t('users')}
        </button>
        <button
          onClick={() => handleTabChange('subscribers')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'subscribers' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
        >
          <FileText size={18} /> {t('subscribers')}
        </button>
        <button
          onClick={() => handleTabChange('devices')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'devices' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
        >
          <HardDrive size={18} /> {t('devices')}
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-black uppercase tracking-wider text-xs">
          <ListFilter size={16} className="text-blue-600" />
          {t('filters')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="number"
              placeholder={t('operator_id')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
            />
          </div>

          {activeTab === 'devices' && (
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={t('device_imei')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
              />
            </div>
          )}

          <div className={`relative ${activeTab !== 'devices' ? 'md:col-span-2 lg:col-span-2' : ''}`}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('search_action')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLogs} className="flex-1 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest">
              {t('apply')}
            </button>
            <button onClick={resetFilters} className="p-2.5 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <FilterX size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">{t('time')}</th>
                  <th className="px-6 py-4">{t('operator_info')}</th>
                  {activeTab === 'devices' && <th className="px-6 py-4">{t('device_imei')}</th>}
                  <th className="px-6 py-4">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 text-sm">#{log.id}</td>
                    <td className="px-6 py-4 font-mono text-slate-700 text-sm">
                      {new Date(log.timestamp).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{log.operator?.full_name || 'System'}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">
                        {log.operator?.role} {log.operator?.region_id ? `| Reg ID: ${log.operator.region_id}` : ''}
                      </div>
                    </td>
                    {activeTab === 'devices' && (
                        <td className="px-6 py-4 font-mono font-bold text-blue-600 text-sm">{log.imei || '-'}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold font-mono tracking-wider leading-relaxed">
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <div className="py-16 text-center text-slate-400 font-bold italic">{t('no_records')}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;