import React, { useState, useEffect } from 'react';
import { userService, geoService } from '../services/api';
import { UserPlus, Search, Shield, MapPin, Trash2, Edit, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Добавлен импорт

const UsersPage = () => {
  const { t } = useTranslation(); // Инициализация
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [filters, setFilters] = useState({ search: '', role: '', region_id: '', district_id: '' });

  const [newUser, setNewUser] = useState({
    username: '', password: '', role: 'ADMIN', full_name: '', phone: '', region_id: null, district_id: null
  });
  const [selectedRegionNewUser, setSelectedRegionNewUser] = useState('');
  const [districtsNewUser, setDistrictsNewUser] = useState([]);

  // Состояния для редактирования
  const [editingUser, setEditingUser] = useState(null);
  const [editDistricts, setEditDistricts] = useState([]);

  useEffect(() => {
    geoService.getRegions().then(res => setRegions(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.region_id) {
      geoService.getDistricts(filters.region_id).then(res => setDistricts(res.data));
    } else {
      setDistricts([]);
      setFilters(prev => ({ ...prev, district_id: '' }));
    }
  }, [filters.region_id]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    if (selectedRegionNewUser) {
      geoService.getDistricts(selectedRegionNewUser).then(res => setDistrictsNewUser(res.data));
    } else {
      setDistrictsNewUser([]);
    }
  }, [selectedRegionNewUser]);

  // Загрузка районов для модального окна редактирования
  useEffect(() => {
    if (editingUser?.region_id) {
      geoService.getDistricts(editingUser.region_id).then(res => setEditDistricts(res.data));
    } else {
      setEditDistricts([]);
    }
  }, [editingUser?.region_id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const res = await userService.getAll(cleanParams);
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser, username: newUser.username.trim().toLowerCase() };
      await userService.create(payload);
      setNewUser({ username: '', password: '', role: 'ADMIN', full_name: '', phone: '', region_id: null, district_id: null });
      setSelectedRegionNewUser('');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || t('Ошибка создания пользователя'));
    }
  };

  // Удаление пользователя
  const handleDelete = async (id, username) => {
    if (!window.confirm(`${t('Вы уверены, что хотите удалить пользователя')} ${username}?`)) return;
    try {
      await userService.delete(id);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || t('Ошибка удаления'));
    }
  };

  // Обновление пользователя
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editingUser };
      if (!payload.password) delete payload.password; // Не отправляем пустой пароль

      await userService.update(editingUser.id, payload);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || t('Ошибка обновления пользователя'));
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      'ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
      'REGIONAL': 'bg-blue-100 text-blue-700 border-blue-200',
      'LOCAL': 'bg-slate-100 text-slate-700 border-slate-200'
    };
    const labels = { 'ADMIN': t('Уровень 1'), 'REGIONAL': t('Уровень 2'), 'LOCAL': t('Уровень 3') };
    return <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${styles[role]}`}>{labels[role]}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase">{t('Пользователи системы')}</h1>
          <p className="text-slate-500 text-sm font-bold">{t('Управление правами доступа и персоналом')}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('ФИО сотрудника')}</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Номер телефона')}</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold outline-none focus:border-blue-500" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Логин')}</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Пароль')}</label>
            <input required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Уровень доступа')}</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none outline-none focus:border-blue-500" value={newUser.role} onChange={e => {setNewUser({...newUser, role: e.target.value, region_id: null, district_id: null}); setSelectedRegionNewUser('');}}>
              <option value="ADMIN">{t('Level 1 (Республика)')}</option>
              <option value="REGIONAL">{t('Level 2 (Область)')}</option>
              <option value="LOCAL">{t('Level 3 (Район)')}</option>
            </select>
          </div>

          {(newUser.role === 'REGIONAL' || newUser.role === 'LOCAL') && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Регион (Филиал)')}</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none outline-none focus:border-blue-500" value={selectedRegionNewUser} onChange={e => {const val = e.target.value; setSelectedRegionNewUser(val); setNewUser({...newUser, region_id: val ? parseInt(val) : null, district_id: null});}}>
                <option value="">{t('Выберите филиал')}</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}

          {newUser.role === 'LOCAL' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Район')}</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none outline-none focus:border-blue-500" value={newUser.district_id || ''} onChange={e => {const val = e.target.value; setNewUser({...newUser, district_id: val ? parseInt(val) : null});}}>
                <option value="">{t('Выберите район')}</option>
                {districtsNewUser.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-[46px] rounded-xl shadow-sm flex justify-center items-center gap-2 text-sm transition-all">
              <UserPlus size={18} /> {t('Создать аккаунт')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text" placeholder={t('Поиск логина...')}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500"
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
        </div>

        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none appearance-none focus:border-blue-500"
            value={filters.role}
            onChange={e => setFilters({...filters, role: e.target.value})}
          >
            <option value="">{t('Все уровни')}</option>
            <option value="ADMIN">{t('Уровень 1')}</option>
            <option value="REGIONAL">{t('Уровень 2')}</option>
            <option value="LOCAL">{t('Уровень 3')}</option>
          </select>
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none appearance-none focus:border-blue-500"
            value={filters.region_id}
            onChange={e => setFilters({...filters, region_id: e.target.value})}
          >
            <option value="">{t('Все регионы')}</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            disabled={!filters.region_id}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none appearance-none disabled:opacity-50 focus:border-blue-500"
            value={filters.district_id}
            onChange={e => setFilters({...filters, district_id: e.target.value})}
          >
            <option value="">{t('Все районы')}</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Сотрудник')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('Уровень')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Зона ответственности')}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Действия')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-black text-slate-800">{user.full_name || user.username}</div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">@{user.username} {user.phone && <span>• {user.phone}</span>}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4">
                  {user.role === 'ADMIN' ? (
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{t('FULL ACCESS')}</span>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{user.region_name || t('НЕТ ДАННЫХ')}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{user.district_name || t('ВЕСЬ РЕГИОН')}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16}/></button>
                    <button onClick={() => handleDelete(user.id, user.username)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('Нет результатов')}</div>
        )}
      </div>

      {/* Модальное окно редактирования */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{t('Редактирование:')} @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('ФИО')}</label>
                <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Телефон')}</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Новый пароль (оставьте пустым, если не меняете)')}</label>
                <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Уровень доступа')}</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value, region_id: null, district_id: null})}>
                  <option value="ADMIN">{t('Level 1 (Республика)')}</option>
                  <option value="REGIONAL">{t('Level 2 (Область)')}</option>
                  <option value="LOCAL">{t('Level 3 (Район)')}</option>
                </select>
              </div>

              {(editingUser.role === 'REGIONAL' || editingUser.role === 'LOCAL') && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Регион (Филиал)')}</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" value={editingUser.region_id || ''} onChange={e => {const val = e.target.value; setEditingUser({...editingUser, region_id: val ? parseInt(val) : null, district_id: null});}}>
                    <option value="">{t('Выберите филиал')}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              {editingUser.role === 'LOCAL' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('Район')}</label>
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" value={editingUser.district_id || ''} onChange={e => {const val = e.target.value; setEditingUser({...editingUser, district_id: val ? parseInt(val) : null});}}>
                    <option value="">{t('Выберите район')}</option>
                    {editDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">{t('Отмена')}</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md">{t('Сохранить')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;