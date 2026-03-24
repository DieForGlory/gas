import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 font-black text-xl text-blue-600">GAS CONTROL v3</div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg">
            <LayoutDashboard size={20} /> Дашборд
          </Link>
          <Link to="/users" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg">
            <Users size={20} /> Пользователи
          </Link>
        </nav>
        <button onClick={handleLogout} className="m-4 flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg">
          <LogOut size={20} /> Выход
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
};

export default Layout;