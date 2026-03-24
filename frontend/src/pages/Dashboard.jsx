import React, { useState } from 'react';
import { subscriberService } from '../services/api';
import DeviceCard from '../components/DeviceCard';
import BalanceModal from '../components/BalanceModal';
import SubscriberModal from '../components/SubscriberModal';
import DeviceModal from '../components/DeviceModal';
import { Search, MapPin, CreditCard, Plus } from 'lucide-react';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [createSubModal, setCreateSubModal] = useState(false);
  const [addDeviceTo, setAddDeviceTo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await subscriberService.search(query);
      setResults(data);
    } catch (error) {
      alert("Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="glass-panel rounded-2xl p-2.5 flex-1">
          <form onSubmit={handleSearch} className="flex gap-2 relative">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-5 text-slate-400" size={22} />
              <input
                className="w-full pl-14 pr-6 py-4 bg-transparent border-none outline-none font-medium text-slate-700 text-lg placeholder:text-slate-400"
                placeholder="Поиск по счету, имени или адресу..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary min-w-[140px] text-lg">
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>
        </div>
        <button onClick={() => setCreateSubModal(true)} className="bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl shadow-soft hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap">
          <Plus size={20} /> Новый абонент
        </button>
      </div>

      <div className="space-y-6">
        {results.map(sub => (
          <div key={sub.account_number} className="bg-white rounded-3xl shadow-soft border border-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-br from-white to-slate-50/50">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-mono font-bold tracking-wide">
                  <CreditCard size={14} /> {sub.account_number}
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{sub.name}</h2>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <MapPin size={16} className="text-slate-400" />
                  <span>{sub.address}</span>
                </div>
              </div>

              <div className="flex flex-col items-end min-w-[200px] bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Баланс счета</span>
                <p className={`text-4xl font-black tabular-nums tracking-tight ${parseFloat(sub.balance) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {sub.balance} <span className="text-2xl opacity-50">₽</span>
                </p>
                <button
                  onClick={() => setSelectedSub(sub)}
                  className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]"
                >
                  Пополнить баланс
                </button>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Оборудование ({sub.devices?.length || 0})</h3>
                <button onClick={() => setAddDeviceTo(sub.account_number)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                  <Plus size={16} /> Привязать устройство
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {sub.devices && sub.devices.length > 0 ? (
                  sub.devices.map(dev => (
                    <DeviceCard key={dev.imei} device={dev} onUpdate={handleSearch} />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-400 font-medium">Нет привязанных устройств</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedSub && <BalanceModal subscriber={selectedSub} onClose={() => setSelectedSub(null)} onUpdate={handleSearch} />}
      {createSubModal && <SubscriberModal onClose={() => setCreateSubModal(false)} onSuccess={() => { setCreateSubModal(false); setQuery(''); }} />}
      {addDeviceTo && <DeviceModal subscriberAccount={addDeviceTo} onClose={() => setAddDeviceTo(null)} onSuccess={handleSearch} />}
    </div>
  );
};

export default Dashboard;