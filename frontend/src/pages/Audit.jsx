import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { History } from 'lucide-react';

const Audit = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminService.getAuditLogs().then(({ data }) => setLogs(data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-slate-900 p-2.5 rounded-xl">
          <History className="text-white" size={24} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Журнал аудита</h2>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Время</th>
                <th className="px-6 py-4">Оператор (ID)</th>
                <th className="px-6 py-4">Устройство (IMEI)</th>
                <th className="px-6 py-4">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-400">{log.id}</td>
                  <td className="px-6 py-4 font-mono text-slate-700">
                    {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{log.operator_id}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{log.imei || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold font-mono tracking-wide">
                      {log.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="py-12 text-center text-slate-400 font-medium">
            Записи отсутствуют
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;