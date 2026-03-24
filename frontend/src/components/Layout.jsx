import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Flame, History } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
          active
            ? 'bg-blue-600/10 text-blue-400'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <aside className="w-[280px] bg-[#0F172A] flex flex-col shadow-2xl z-20 shrink-0">
        <div className="h-24 flex items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Flame className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight text-lg leading-tight">GAS CONTROL</h1>
              <p className="text-blue-400/80 text-[10px] uppercase tracking-widest font-bold">System v3.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Обзорная панель" />
          <NavItem to="/users" icon={Users} label="Администраторы" />
          <NavItem to="/audit" icon={History} label="Журнал аудита" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl font-medium transition-all"
          >
            <LogOut size={18} /> Завершить сеанс
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 w-full h-64 bg-[#0F172A]/[0.02] pointer-events-none" />
        <div className="p-8 max-w-[1600px] mx-auto min-h-full relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;