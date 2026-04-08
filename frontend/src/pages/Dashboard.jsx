import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriberService, geoService } from '../services/api';
import SubscriberModal from '../components/SubscriberModal';
import {
  Search, Plus, Loader2, ChevronLeft, ChevronRight,
  Hash, MapPin, User, ShieldAlert, Globe, FilterX, ListFilter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Состояния фильтрации
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Данные и пагинация
  const [data, setData] = useState({ total: 0, items: [] });
  const [page, setPage] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(false);
  const [createSubModal, setCreateSubModal] = useState(false);

  // Списки для выпадающих меню
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Определение прав доступа
  const getRole = () => {
    try {
      const token = localStorage.getItem('token');
      return token ? JSON.parse(atob(token.split('.')[1])) : {};
    } catch { return {}; }
  };

  const user = getRole();
  const isAdmin = user.role === 'ADMIN';
  const isRegional = user.role === 'REGIONAL';
  const isLocal = user.role === 'LOCAL';

  // Инициализация гео-данных
  useEffect(() => {
    geoService.getRegions().then(res => setRegions(res.data));

    if ((isRegional || isLocal) && user.region_id) {
        setSelectedRegion(user.region_id);
    }
    if (isLocal && user.district_id) {
        setSelectedDistrict(user.district_id);
    }
  }, []);

  // Загрузка районов при смене региона
  useEffect(() => {
    if (selectedRegion) {
      geoService.getDistricts(selectedRegion).then(res => setDistricts(res.data));
    } else {
      setDistricts([]);
    }
  }, [selectedRegion]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await subscriberService.search(
        appliedQuery,
        page * limit,
        limit,
        selectedRegion,
        selectedDistrict,
        selectedStatus
      );
      setData(response.data || { total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  }, [page, appliedQuery, selectedRegion, selectedDistrict, selectedStatus]);

  // Механизм автообновления данных (Polling) каждые 30 секунд
  useEffect(() => {
    fetchSubscribers();

    const interval = setInterval(() => {
      fetchSubscribers();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSubscribers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedQuery(query);
  };

  const resetFilters = () => {
    setQuery('');
    setAppliedQuery('');
    if (isAdmin) setSelectedRegion('');
    if (isAdmin || isRegional) setSelectedDistrict('');
    setSelectedStatus('');
    setPage(0);
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-black uppercase tracking-wider text-xs">
          <ListFilter size={16} className="text-blue-600" />
          Панель поиска и фильтрации
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Л/С или ФИО..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm font-bold"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            />
          </div>

          <select
            disabled={!isAdmin}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 disabled:opacity-60 transition-all appearance-none cursor-pointer"
            value={selectedRegion}
            onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDistrict(''); setPage(0); }}
          >
            <option value="">Все филиалы (Города)</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select
            disabled={isLocal || (!isAdmin && !isRegional)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 disabled:opacity-60 transition-all appearance-none cursor-pointer"
            value={selectedDistrict}
            onChange={(e) => { setSelectedDistrict(e.target.value); setPage(0); }}
          >
            <option value="">Все районы</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
          >
            <option value="">Любой статус</option>
            <option value="ACTIVE">Активен</option>
            <option value="SUSPENDED">Приостановлен</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest"
            >
              Найти
            </button>
            <button
              onClick={resetFilters}
              title="Сбросить все фильтры"
              className="p-2.5 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <FilterX size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Реестр абонентов</h2>
        <button
          onClick={() => setCreateSubModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm"
        >
          <Plus size={18} /> Добавить абонента
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24 text-blue-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Лицевой счет</th>
                  <th className="px-6 py-4">ФИО / Организация</th>
                  <th className="px-6 py-4">Филиал → Район</th>
                  <th className="px-6 py-4">Адрес объекта</th>
                  <th className="px-6 py-4 text-center">Статус договора</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((sub) => (
                  <tr
                    key={sub.account_number}
                    onClick={() => navigate(`/subscriber/${sub.account_number}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 text-sm">
                      {sub.account_number}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase">
                        <Globe size={12} className="text-slate-400" />
                        {sub.district?.region?.name || '---'}
                        <span className="text-slate-300">/</span>
                        {sub.district?.name || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium max-w-xs truncate">
                      {sub.address}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                        sub.contract_status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {sub.contract_status === 'ACTIVE' ? 'Активен' : 'Отключен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.items.length === 0 && (
              <div className="text-center py-20 text-slate-400 font-bold italic">
                По данным критериям ничего не найдено
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
          Всего в базе: {data.total}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={20}/>
          </button>
          <div className="flex items-center px-4 text-sm font-black text-slate-700">
            {page + 1}
          </div>
          <button
            disabled={(page + 1) * limit >= data.total}
            onClick={() => setPage(p => p + 1)}
            className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronRight size={20}/>
          </button>
        </div>
      </div>

      {createSubModal && (
        <SubscriberModal
          onClose={() => setCreateSubModal(false)}
          onSuccess={(acc) => { setAppliedQuery(acc); setPage(0); }}
        />
      )}
    </div>
  );
};

export default Dashboard;