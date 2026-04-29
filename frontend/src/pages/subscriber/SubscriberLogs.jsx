import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { subscriberService } from '../../services/api';
import { Clock, User, Hash, Activity, X, Phone, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Добавлен импорт

const SubscriberLogs = () => {
  const { t } = useTranslation(); // Инициализация
  const { subscriber } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);

  useEffect(() => {
    subscriberService.getAudit(subscriber.account_number).then(res => setLogs(res.data));
  }, [subscriber.account_number]);

  const formatLogTime = (dateString) => {
    if (!dateString) return '--';
    const utcDateString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Tashkent'
    }).format(new Date(utcDateString));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300 relative">
      <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <div className="col-span-3">{t('Время (GMT+5)')}</div>
        <div className="col-span-3">{t('Оператор')}</div>
        <div className="col-span-3">{t('IMEI')}</div>
        <div className="col-span-3">{t('Действие')}</div>
      </div>

      <div className="divide-y divide-slate-100">
        {logs.map(log => (
          <div key={log.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 hover:bg-slate-50 transition-colors items-start lg:items-center text-sm">
            <div className="col-span-1 lg:col-span-3 flex items-center gap-2">
              <Clock size={14} className="text-slate-400 lg:hidden" />
              <span className="font-mono text-slate-700">{formatLogTime(log.timestamp)}</span>
            </div>

            <div className="col-span-1 lg:col-span-3 flex items-center gap-2">
              <User size={14} className="text-slate-400 lg:hidden" />
              {log.operator ? (
                <button
                  onClick={() => setSelectedOperator(log.operator)}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                >
                  {log.operator.full_name || log.operator.username}
                </button>
              ) : (
                <span className="font-medium text-slate-700">ID: {log.operator_id}</span>
              )}
            </div>

            <div className="col-span-1 lg:col-span-3 flex items-center gap-2">
              <Hash size={14} className="text-slate-400 lg:hidden" />
              <span className="font-mono font-bold text-slate-600">{log.imei || '-'}</span>
            </div>

            <div className="col-span-1 lg:col-span-3 flex items-center gap-2 mt-1 lg:mt-0">
              <Activity size={14} className="text-slate-400 lg:hidden" />
              <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold font-mono tracking-wider break-words max-w-full">
                {log.action}
              </span>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="py-16 text-center text-slate-400 font-bold italic">
          {t('Записи отсутствуют')}
        </div>
      )}

      {selectedOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">{t('Данные оператора')}</h3>
              <button onClick={() => setSelectedOperator(null)} className="text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {(selectedOperator.full_name || selectedOperator.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{selectedOperator.full_name || t('ФИО не указано')}</div>
                  <div className="text-xs font-mono text-slate-500">@{selectedOperator.username}</div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-sm">
                  <Shield size={16} className="text-slate-400" />
                  <span className="text-slate-600 font-medium">
                    {selectedOperator.role === 'ADMIN' ? t('Администратор') : selectedOperator.role === 'REGIONAL' ? t('Региональный менеджер') : t('Локальный оператор')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-slate-600 font-medium">
                    {selectedOperator.phone || t('Телефон не указан')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriberLogs;