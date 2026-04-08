import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { subscriberService } from '../../services/api';
import { Clock, User, Hash, Activity } from 'lucide-react';

const SubscriberLogs = () => {
  const { subscriber } = useOutletContext();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    subscriberService.getAudit(subscriber.account_number).then(res => setLogs(res.data));
  }, [subscriber.account_number]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
      <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="col-span-3">Время</div>
        <div className="col-span-2">Оператор</div>
        <div className="col-span-4">IMEI</div>
        <div className="col-span-3">Действие</div>
      </div>

      <div className="divide-y divide-slate-100">
        {logs.map(log => (
          <div key={log.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 hover:bg-slate-50 transition-colors items-start lg:items-center text-sm">
            <div className="col-span-1 lg:col-span-3 flex items-center gap-2">
              <Clock size={14} className="text-slate-400 lg:hidden" />
              <span className="font-mono text-slate-700">{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
            </div>

            <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
              <User size={14} className="text-slate-400 lg:hidden" />
              <span className="font-medium text-slate-700">ID: {log.operator_id}</span>
            </div>

            <div className="col-span-1 lg:col-span-4 flex items-center gap-2">
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
          Записи отсутствуют
        </div>
      )}
    </div>
  );
};
export default SubscriberLogs;