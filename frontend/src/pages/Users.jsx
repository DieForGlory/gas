import React, { useEffect, useState } from 'react';
import { adminService, geoService } from '../services/api';
import { ShieldCheck, UserPlus, Shield, Phone, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'ADMIN',
    full_name: '',
    phone: '',
    region_id: null,
    district_id: null
  });

  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await adminService.getUsers();
      setUsers(data);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    geoService.getRegions().then(res => setRegions(res.data));
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      geoService.getDistricts(selectedRegion).then(res => setDistricts(res.data));
    } else { setDistricts([]); }
  }, [selectedRegion]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(newUser);
      setNewUser({ username: '', password: '', role: 'ADMIN', full_name: '', phone: '', region_id: null, district_id: null });
      setSelectedRegion('');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка создания пользователя');
    }
  };

  return (
    <div className="max-w-7xl space-y-6 lg:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-slate-900 p-2.5 rounded-xl"><ShieldCheck className="text-white" size={24} /></div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Управление персоналом</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ФИО сотрудника</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Номер телефона</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Логин</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Пароль</label>
            <input required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Уровень доступа</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none" value={newUser.role} onChange={e => {setNewUser({...newUser, role: e.target.value, region_id: null, district_id: null}); setSelectedRegion('');}}>
              <option value="ADMIN">Level 1 (Республика)</option>
              <option value="REGIONAL">Level 2 (Область)</option>
              <option value="LOCAL">Level 3 (Район)</option>
            </select>
          </div>

          {(newUser.role === 'REGIONAL' || newUser.role === 'LOCAL') && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Регион (Филиал)</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none" value={selectedRegion} onChange={e => {setSelectedRegion(e.target.value); setNewUser({...newUser, region_id: parseInt(e.target.value), district_id: null});}}>
                <option value="">Выберите филиал</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}

          {newUser.role === 'LOCAL' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Район</label>
              <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold appearance-none" value={newUser.district_id || ''} onChange={e => setNewUser({...newUser, district_id: parseInt(e.target.value)})}>
                <option value="">Выберите район</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-[46px] rounded-xl shadow-sm flex justify-center items-center gap-2 text-sm transition-all">
              <UserPlus size={18} /> Создать аккаунт
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Сотрудник</th>
              <th className="px-6 py-4">Контакты</th>
              <th className="px-6 py-4">Роль</th>
              <th className="px-6 py-4">Логин</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><UserIcon size={16}/></div>
                    <span className="font-bold text-slate-800">{u.full_name || '---'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                    <Phone size={12}/> {u.phone || '---'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${
                    u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 font-mono text-slate-400 font-bold">{u.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;