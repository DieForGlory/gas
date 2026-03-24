import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { ShieldCheck, UserPlus } from 'lucide-react';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'OPERATOR' });

  const fetchUsers = async () => {
    try {
      const { data } = await adminService.getUsers();
      setUsers(data);
    } catch (error) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(newUser);
      setNewUser({ username: '', password: '', role: 'OPERATOR' });
      fetchUsers();
    } catch (error) {
      alert('Ошибка создания пользователя');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-slate-900 p-2.5 rounded-xl">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Администраторы</h2>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Логин</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Пароль</label>
            <input required type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          </div>
          <div className="w-full md:w-auto">
            <button type="submit" className="w-full md:w-auto btn-primary flex justify-center items-center gap-2">
              <UserPlus size={18} /> Создать
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-slate-200/60 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {users.map(user => (
            <div key={user.id} className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
              <span className="font-bold text-slate-800">{user.username}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;