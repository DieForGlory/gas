import React, { useState } from 'react';
import { deviceService } from '../services/api';
import { Battery, Wifi, Activity, Settings2, RefreshCcw, Wrench, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DeviceCard = ({ device, onUpdate }) => {
  const { t } = useTranslation();
  const [hb, setHb] = useState(device.hb_interval);
  const [loadingCmd, setLoadingCmd] = useState('');

  const isOnline = device.is_online;

  const getRole = () => {
    try {
      const token = localStorage.getItem('token');
      return token ? JSON.parse(atob(token.split('.')[1]))?.role : null;
    } catch { return null; }
  };

  const isAdmin = getRole() === 'ADMIN';

  const handleCommand = async (cmd) => {
    setLoadingCmd(cmd);
    try {
      await deviceService.sendCommand(device.imei, cmd);
      onUpdate();
    } finally { setLoadingCmd(''); }
  };

  const updateConfig = async (payload) => {
    await deviceService.updateConfig(device.imei, payload);
    onUpdate();
  };

  const getStatusText = (l, r, p) => {
    if (p === 1) return 'Ожидание кнопки';
    if (l === 1 && r === 1) return 'Открыт';
    if (l === 0 && r === 0) return 'Закрыт';
    return `${l}/${r}`;
  };

  const getSignalPercentage = (s) => {
    if (!s) return 0;
    const pct = Math.round((s / 31) * 100);
    return pct > 100 ? 100 : pct;
  };

  const formatLastOnline = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Tashkent'
    }).format(date);
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col h-full relative overflow-hidden ${isOnline ? 'border-slate-200' : 'border-rose-200 bg-rose-50/30'}`}>
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-3 w-3">
              {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-sm font-black text-slate-900 tracking-wider font-mono">{device.imei}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${
          device.auth_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          {device.auth_status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>АКБ</span>
            <Battery size={14} className={device.battery > 3.5 ? 'text-emerald-500' : 'text-rose-500'} />
          </div>
          <div className="font-mono text-lg font-black text-slate-800">{device.battery ? `${device.battery}V` : '--'}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Сигнал</span>
            <Wifi size={14} className="text-blue-500" />
          </div>
          <div className="font-mono text-lg font-black text-slate-800">{device.rssi ? `${getSignalPercentage(device.rssi)}%` : '--'}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Клапан</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <div className="font-bold text-xs uppercase text-slate-800 truncate">
            {device.state_l !== null ? getStatusText(device.state_l, device.state_r, device.state_p) : '--'}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Ошибки</span>
          </div>
          <div className={`font-bold text-xs uppercase ${device.error_flag === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {device.error_flag === 0 ? 'Норма' : `Код ${device.error_flag}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <button onClick={() => handleCommand('OPEN')} disabled={loadingCmd !== ''} className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">Открыть</button>
        <button onClick={() => handleCommand('CLOSE')} disabled={loadingCmd !== ''} className="bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">Закрыть</button>
        <button onClick={() => handleCommand('SERVICE')} disabled={loadingCmd !== ''} className="bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-1 disabled:opacity-50">
          <Wrench size={12} /> Сервис
        </button>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-4 space-y-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-2.5 rounded-lg">
          <div className="flex items-center gap-1.5 uppercase tracking-widest"><Clock size={14} /> Последний сеанс (GMT+5)</div>
          <span className="font-mono text-slate-800">{formatLastOnline(device.last_online)}</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Settings2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="number" value={hb} onChange={(e) => setHb(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold outline-none" />
          </div>
          <button onClick={() => updateConfig({ hb_interval: parseInt(hb) })} className="px-3 text-[10px] uppercase tracking-widest bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200">Обновить</button>
        </div>

        {isAdmin && (
          <button onClick={async () => { if(window.confirm('Сбросить ключи?')) { await deviceService.resetKey(device.imei); onUpdate(); } }} className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors uppercase tracking-widest">
            <RefreshCcw size={12} /> Сброс ключей
          </button>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;