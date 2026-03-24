import React, { useState } from 'react';
import { deviceService } from '../services/api';
import { Settings, RefreshCw, Power, ShieldAlert } from 'lucide-react';

const DeviceCard = ({ device, onUpdate }) => {
  const [hb, setHb] = useState(device.hb_interval);

  // Расчет статуса Online (hb_interval + 60s) согласно ТЗ
  const isOnline = (new Date() - new Date(device.last_online)) / 1000 < (device.hb_interval + 60);

  const handleCommand = async (cmd) => {
    await deviceService.sendCommand(device.imei, cmd);
    onUpdate();
  };

  const updateInterval = async () => {
    await deviceService.updateConfig(device.imei, { hb_interval: parseInt(hb) }); //
    alert('Интервал обновлен');
  };

  const resetKey = async () => {
    if(confirm("Сбросить секретный ключ устройства?")) {
      await deviceService.resetKey(device.imei); //
      onUpdate();
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-gray-700">IMEI: {device.imei}</h4>
          <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
            {isOnline ? '● Online' : '○ Offline'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Тип клапана</p>
          <p className="text-sm font-semibold">{device.valve_type === 0 ? 'Chint' : 'H-Bridge'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-gray-400 text-[10px]">Заряд</p>
          <p className="font-bold">{device.battery || 0}V</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-gray-400 text-[10px]">Сигнал</p>
          <p className="font-bold">{device.rssi || 0} dBm</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-gray-400 text-[10px]">Состояние</p>
          <p className={`font-bold ${device.error_flag ? 'text-red-500' : ''}`}>
            {device.error_flag ? 'JAMMED' : (device.state_r === 1 ? 'OPEN' : 'CLOSED')}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => handleCommand('OPEN')} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">ОТКРЫТЬ</button>
        <button onClick={() => handleCommand('CLOSE')} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">ЗАКРЫТЬ</button>
      </div>

      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={hb}
            onChange={(e) => setHb(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={updateInterval} className="text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">Set Heartbeat</button>
        </div>
        <button onClick={resetKey} className="w-full flex items-center justify-center gap-2 text-xs text-red-600 border border-red-100 py-2 rounded hover:bg-red-50">
          <ShieldAlert size={14} /> Сбросить секретный ключ
        </button>
      </div>
    </div>
  );
};

export default DeviceCard;