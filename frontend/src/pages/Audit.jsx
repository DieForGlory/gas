import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { History, Clock, User, Hash, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Audit = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminService.getAuditLogs().then(({ data }) => setLogs(data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl space-y-6 lg:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 p-2.5 rounded-xl">
          <History className="text-white" size={24} />
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{t('audit_log', 'Журнал аудита')}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">{t('time', 'Время')}</div>
          <div className="col-span-2">{t('operator_id', 'Оператор')}</div>
          <div className="col-span-3">{t('device_imei', 'IMEI')}</div>
          <div className="col-span-3">{t('action', 'Действие')}</div>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 hover:bg-slate-50 transition-colors items-start lg:items-center text-sm">
              <div className="col-span-1 lg:col-span-1 flex items-center gap-2">
                <span className="font-mono text-slate-400 font-medium">#{log.id}</span>
              </div>

              <div className="col-span-1 lg:col-span-3 flex items-center gap-2">
                <Clock size={14} className="text-slate-400 lg:hidden" />
                <span className="font-mono text-slate-700">{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
              </div>

              <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
                <User size={14} className="text-slate-400 lg:hidden" />
                <span className="font-medium text-slate-700">ID: {log.operator_id}</span>
              </div>

              <div className="col-span-1 lg:col-span-3 flex items-center gap-2">
                <Hash size={14} className="text-slate-400 lg:hidden" />
                <span className="font-mono font-bold text-blue-600">{log.imei || '-'}</span>
              </div>

              <div className="col-span-1 lg:col-span-3 flex items-center gap-2 mt-1 lg:mt-0">
                <Activity size={14} className="text-slate-400 lg:hidden" />
                <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold font-mono tracking-wider">
                  {log.action}
                </span>
              </div>
            </div>
          ))}
        </div>

        {logs.length === 0 && (
          <div className="py-16 text-center text-slate-400 font-bold italic">
            {t('no_records', 'Записи отсутствуют')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;