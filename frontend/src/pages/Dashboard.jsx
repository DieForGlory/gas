import React, { useState } from 'react';
import { subscriberService } from '../services/api';
import DeviceCard from '../components/DeviceCard';
import BalanceModal from '../components/BalanceModal';
import { Search } from 'lucide-react';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await subscriberService.search(query); //
      setResults(data);
    } catch (error) {
      console.error("Ошибка поиска:", error);
      alert("Ошибка при выполнении поиска");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Введите лицевой счет, ФИО или адрес абонента..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Поиск...' : 'НАЙТИ'}
          </button>
        </form>
      </div>

      <div className="space-y-8">
        {results.length === 0 && !loading && query && (
          <div className="text-center py-20 text-gray-400">Ничего не найдено</div>
        )}

        {results.map(sub => (
          <div key={sub.account_number} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800">{sub.name}</h2>
                <p className="text-gray-500 font-medium">{sub.address}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Л/С: {sub.account_number}</span>
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Пополнить баланс
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-2xl text-right min-w-[150px]">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Текущий баланс</p>
                <p className={`text-2xl font-black ${parseFloat(sub.balance) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {sub.balance} ₽
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sub.devices && sub.devices.length > 0 ? (
                sub.devices.map(dev => (
                  <DeviceCard key={dev.imei} device={dev} onUpdate={handleSearch} /> //
                ))
              ) : (
                <div className="col-span-full py-4 text-sm text-gray-400 italic">Нет зарегистрированных устройств</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedSub && (
        <BalanceModal
          subscriber={selectedSub}
          onClose={() => setSelectedSub(null)}
          onUpdate={handleSearch}
        />
      )}
    </div>
  );
};

export default Dashboard;