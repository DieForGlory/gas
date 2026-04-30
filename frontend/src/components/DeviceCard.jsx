import React, { useState, useEffect, useRef } from 'react';
import { deviceService, valveTypeService } from '../services/api';
import {
  Battery, Wifi, Activity, Settings2, RefreshCcw,
  Wrench, Clock, Smartphone, ChevronDown,
  CheckCircle2, Loader2, Database, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ServiceModal from './ServiceModal';
import TelemetryModal from './TelemetryModal';

const DeviceCard = ({ device, onUpdate }) => {
  const { t } = useTranslation();
  const [hb, setHb] = useState(device.hb_interval);
  const [sim, setSim] = useState(device.sim_number || '');
  const [vType, setVType] = useState(device.valve_type);
  const [valveTypes, setValveTypes] = useState([]);
  const [loadingCmd, setLoadingCmd] = useState('');

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);

  const prevPending = useRef(device.pending_command);
  const serviceRequestedRef = useRef(false);
  const [syncSuccess, setSyncSuccess] = useState({ vType: false, hb: false });

  const isOnline = device.is_online;
  const isKeyResetPending = device.is_key_reset_pending;

  const formatTime = (dateStr) => {
    if (!dateStr) return t('Никогда не был в сети');
    const normalized = dateStr.replace(' ', 'T');
    const utcStr = normalized.endsWith('Z') || normalized.includes('+') ? normalized : normalized + 'Z';
    return new Date(utcStr).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  };

  const getRole = () => {
    try {
      const token = localStorage.getItem('token');
      return token ? JSON.parse(atob(token.split('.')[1]))?.role : null;
    } catch { return null; }
  };

  const isSuperAdmin = getRole() === 'SUPER_ADMIN';

  useEffect(() => {
    if (isSuperAdmin) {
      valveTypeService.getAll().then(res => setValveTypes(res.data));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (prevPending.current && !device.pending_command) {
      if (prevPending.current.includes('SET_VTYPE')) setSyncSuccess(s => ({ ...s, vType: true }));
      if (prevPending.current.includes('SET_HB')) setSyncSuccess(s => ({ ...s, hb: true }));
      setTimeout(() => setSyncSuccess({ vType: false, hb: false }), 3000);
    }
    prevPending.current = device.pending_command;
  }, [device.pending_command]);

  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let pollTimer;
    if (device.pending_command || device.state_p === 1 || isKeyResetPending) {
      pollTimer = setInterval(() => {
        if (onUpdateRef.current) onUpdateRef.current();
      }, 2000);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [device.pending_command, device.state_p, isKeyResetPending]);

  const updateConfig = async (payload) => {
    try {
      await deviceService.update(device.imei, payload);
      onUpdate();
    } catch (err) {
      alert(t('Ошибка обновления конфигурации'));
    }
  };

  const sendCommand = async (cmd) => {
    setLoadingCmd(cmd);
    try {
      await deviceService.sendCommand(device.imei, cmd);
      if (cmd === 'SERVICE') {
        serviceRequestedRef.current = true;
      }
      onUpdate();
    } catch (err) {
      alert(t('Ошибка отправки команды'));
    } finally {
      setLoadingCmd('');
    }
  };

  const handleDeleteDevice = async () => {
    if (window.confirm(t('Вы уверены, что хотите удалить устройство? Данное действие необратимо.'))) {
      try {
        await deviceService.delete(device.imei);
        onUpdate();
      } catch (err) {
        alert(t('Ошибка удаления устройства'));
      }
    }
  };

  useEffect(() => {
    if (serviceRequestedRef.current && device.state_p === 1) {
      setShowServiceModal(true);
      serviceRequestedRef.current = false;
    }
  }, [device.state_p]);

  const isVTypePending = device.pending_command?.includes('SET_VTYPE');
  const isHbPending = device.pending_command?.includes('SET_HB');

  return (
    <div className={`relative overflow-hidden bg-white border ${isOnline ? 'border-slate-200' : 'border-slate-100 opacity-80'} rounded-3xl p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 group`}>

      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{device.imei}</h3>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {device.subscriber_account || t('Без привязки')}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {formatTime(device.last_online)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1">
              <Wifi size={14} className={isOnline ? 'text-blue-500' : 'text-slate-300'} />
              <span className="text-xs font-bold text-slate-600">{device.rssi || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Battery size={14} className={device.battery > 20 ? 'text-emerald-500' : 'text-rose-500'} />
              <span className="text-xs font-bold text-slate-600">{device.battery?.toFixed(1)}V</span>
            </div>
          </div>
        </div>
      </div>

      {isKeyResetPending && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700">
            {t('Ожидание устройства для сброса ключа')}
          </span>
          <Loader2 size={14} className="text-amber-500 animate-spin" />
        </div>
      )}

      {device.pending_command && !isKeyResetPending && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-blue-700">
            {t('Ожидает команду')}
          </span>
          <Loader2 size={14} className="text-blue-500 animate-spin" />
        </div>
      )}

      {device.state_p === 1 && !isKeyResetPending && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700">
            {t('Ожидание нажатия кнопки на устройстве!')}
          </span>
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        </div>
      )}

      <div className="mb-6">
        <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${device.state_l === 1 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('КЛАПАН')}</span>
          <span className={`text-lg font-black ${device.state_l === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {device.state_l === 1 ? t('ОТКРЫТ') : t('ЗАКРЫТ')}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <button
            disabled={loadingCmd === 'OPEN' || !isOnline || isKeyResetPending}
            onClick={() => sendCommand('OPEN')}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-200/50 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            {loadingCmd === 'OPEN' ? <Loader2 size={16} className="animate-spin" /> : t('ОТКРЫТЬ')}
          </button>
          <button
            disabled={loadingCmd === 'CLOSE' || !isOnline || isKeyResetPending}
            onClick={() => sendCommand('CLOSE')}
            className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3 rounded-2xl shadow-lg shadow-rose-200/50 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            {loadingCmd === 'CLOSE' ? <Loader2 size={16} className="animate-spin" /> : t('ЗАКРЫТЬ')}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            disabled={loadingCmd === 'STATUS' || !isOnline || isKeyResetPending}
            onClick={() => sendCommand('STATUS')}
            className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
          >
            {loadingCmd === 'STATUS' ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />} {t('Статус')}
          </button>
          <button
            disabled={loadingCmd === 'SERVICE' || !isOnline || isKeyResetPending}
            onClick={() => sendCommand('SERVICE')}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
          >
            {loadingCmd === 'SERVICE' ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />} {t('Сервис')}
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        {isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={12} /> {t('Конфигурация')}
              </span>
              <button
                onClick={() => setShowTelemetry(true)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-[10px] font-bold uppercase tracking-tighter"
              >
                <Database size={10} /> {t('Логи ответа')}
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={hb}
                  disabled={isKeyResetPending}
                  onChange={(e) => setHb(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-bold outline-none focus:border-blue-400 disabled:bg-slate-100 transition-colors"
                  placeholder="HB (сек)"
                />
              </div>
              <button
                disabled={isHbPending || isKeyResetPending}
                onClick={() => updateConfig({ hb_interval: parseInt(hb) })}
                className={`px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                  syncSuccess.hb ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:text-slate-400'
                }`}
              >
                {syncSuccess.hb ? <CheckCircle2 size={16} /> : isHbPending ? <Loader2 size={14} className="animate-spin" /> : t('Интервал')}
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={vType}
                  disabled={isKeyResetPending}
                  onChange={(e) => setVType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none appearance-none focus:border-blue-400 disabled:bg-slate-100 transition-colors"
                >
                  {valveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <button
                disabled={isVTypePending || isKeyResetPending}
                onClick={() => updateConfig({ valve_type: parseInt(vType) })}
                className={`px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                  syncSuccess.vType ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:text-slate-400'
                }`}
              >
                {syncSuccess.vType ? <CheckCircle2 size={16} /> : isVTypePending ? <Loader2 size={14} className="animate-spin" /> : t('Тип')}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={sim}
              disabled={isKeyResetPending}
              onChange={(e) => setSim(e.target.value)}
              placeholder={t('SIM номер')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold outline-none focus:border-blue-400 disabled:bg-slate-100 transition-colors"
            />
          </div>
          <button
            disabled={isKeyResetPending}
            onClick={() => updateConfig({ sim_number: sim })}
            className="px-3 text-[10px] uppercase tracking-widest bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 disabled:text-slate-400"
          >
            {t('Обновить SIM')}
          </button>
        </div>

        {isSuperAdmin && (
          <div className="space-y-2 mt-4">
            <button
              disabled={isKeyResetPending}
              onClick={async () => {
                if (window.confirm(t('Сбросить ключи шифрования для этого устройства?'))) {
                  await deviceService.resetKey(device.imei);
                  onUpdate();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors uppercase tracking-widest border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isKeyResetPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
              {isKeyResetPending ? t('Ожидание сброса...') : t('Сброс ключей')}
            </button>

            <button
              disabled={isKeyResetPending}
              onClick={handleDeleteDevice}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors uppercase tracking-widest border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={12} /> {t('Удалить устройство')}
            </button>
          </div>
        )}
      </div>

      {showServiceModal && (
        <ServiceModal
          device={device}
          onClose={() => setShowServiceModal(false)}
          onUpdate={onUpdate}
        />
      )}

      {showTelemetry && (
        <TelemetryModal
          imei={device.imei}
          onClose={() => setShowTelemetry(false)}
        />
      )}
    </div>
  );
};

export default DeviceCard;