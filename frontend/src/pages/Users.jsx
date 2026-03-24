import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'OPERATOR' });

  const fetchUsers = async () => {
    const { data } = await adminService.getUsers(); //
    setUsers(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await adminService.createUser(newUser); //
    setNewUser({ username: '', password: '', role: 'OPERATOR' });
    fetchUsers();
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-black mb-6">Управление персоналом</h2>
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-400 block mb-1">Логин</label>
          <input className="w-full border p-2 rounded-lg" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-400 block mb-1">Пароль</label>
          <input className="w-full border p-2 rounded-lg" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Добавить</button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {users.map(user => (
          <div key={user.id} className="p-4 border-b last:border-0 flex justify-between">
            <span className="font-bold">{user.username}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;