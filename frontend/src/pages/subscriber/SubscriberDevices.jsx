import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DeviceCard from '../../components/DeviceCard';
import DeviceModal from '../../components/DeviceModal';
import { Plus, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SubscriberDevices = () => {
  const { subscriber, refresh } = useOutletContext();
  const [addModal, setAddModal] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-3 lg:p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 font-bold px-2">
          <Server size={18} className="text-blue-500" />
          <span className="text-sm lg:text-base">{t('Оборудование')} ({subscriber.devices.length})</span>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-4 py-2 lg:py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
        >
          <Plus size={18} /> <span className="hidden sm:inline">{t('Привязать устройство')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {[...subscriber.devices]
          .sort((a, b) => String(a.imei).localeCompare(String(b.imei)))
          .map(device => (
            <DeviceCard key={device.imei} device={device} onUpdate={refresh} />
        ))}

        {subscriber.devices.length === 0 && (
           <div className="col-span-full py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             {t('Нет привязанных устройств')}
           </div>
        )}
      </div>

      {addModal && (
        <DeviceModal
          subscriberAccount={subscriber.account_number}
          onClose={() => setAddModal(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

export default SubscriberDevices;