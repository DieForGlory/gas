import React, { useState } from 'react';
import { deviceService } from '../services/api';
import { Power, ShieldAlert, Battery, Wifi, Activity, Settings2 } from 'lucide-react';

const DeviceCard = ({ device, onUpdate }) => {
  const [hb, setHb] = useState(device.hb_interval);
  const [loadingCmd, setLoadingCmd] = useState('');

  const isOnline = (new Date() - new Date(device.last_online)) / 1000 < (device.hb_interval + 60);

  const handleCommand = async (cmd) => {
    setLoadingCmd(cmd);
    try {
      await deviceService.sendCommand(device.imei, cmd);
      onUpdate();
    } finally {
      setLoadingCmd('');
    }
  };

  const updateInterval = async () => {
    await deviceService.updateConfig(device.imei, { hb_interval: parseInt(hb) });
    onUpdate();
  };

  const resetKey = async () => {
    if(confirm("Сбросить ключи шифрования? Устройство перейдет в режим сопряжения.")) {
      await deviceService.resetKey(device.imei);
      onUpdate();
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-soft transition-all group flex flex-col h-full relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isOnline ? 'На связи' : 'Офлайн'}
            </span>
          </div>
          <h4 className="font-mono text-lg font-bold text-slate-900 tracking-tight">{device.imei}</h4>
        </div>
        <div className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-200">
          {device.valve_type === 0 ? 'Chint' : 'H-Bridge'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="metric-box">
          <Battery size={16} className="text-slate-400 mb-1.5" />
          <p className="font-mono font-bold text-slate-700 text-sm">{device.battery || '0.0'} V</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Заряд</p>
        </div>
        <div className="metric-box">
          <Wifi size={16} className="text-slate-400 mb-1.5" />
          <p className="font-mono font-bold text-slate-700 text-sm">{device.rssi || 0}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">dBm</p>
        </div>
        <div className={`metric-box border-transparent ${
          device.error_flag ? 'bg-rose-50 text-rose-700' :
          device.state_r === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
        }`}>
          <Activity size={16} className="mb-1.5 opacity-60" />
          <p className="font-bold text-xs uppercase tracking-wider">
            {device.error_flag ? 'ОШИБКА' : (device.state_r === 1 ? 'ОТКРЫТО' : 'ЗАКРЫТО')}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">Клапан</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 mt-auto">
        <button
          onClick={() => handleCommand('OPEN')}
          disabled={loadingCmd !== ''}
          className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 hover:border-emerald-500 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 active:scale-95"
        >
          {loadingCmd === 'OPEN' && <Power size={14} className="animate-pulse" />} ОТКРЫТЬ
        </button>
        <button
          onClick={() => handleCommand('CLOSE')}
          disabled={loadingCmd !== ''}
          className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 hover:border-rose-500 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 active:scale-95"
        >
          {loadingCmd === 'CLOSE' && <Power size={14} className="animate-pulse" />} ЗАКРЫТЬ
        </button>
      </div>

      <div className="pt-5 border-t border-slate-100/80 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Settings2 size={14} className="absolute left-3 text-slate-400" />
            <input
              type="number"
              value={hb}
              onChange={(e) => setHb(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-mono font-medium outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={updateInterval}
            className="px-4 text-xs bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Интервал
          </button>
        </div>
        <button
          onClick={resetKey}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-600 bg-transparent hover:bg-rose-50 py-2.5 rounded-lg transition-colors group-hover:opacity-100 opacity-50"
        >
          <ShieldAlert size={14} /> Сброс ключей устройства
        </button>
      </div>
    </div>
  );
};

export default DeviceCard;