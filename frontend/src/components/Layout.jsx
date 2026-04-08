import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Flame, History, Globe, Settings2, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Layout = ({ children }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getRole = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      return JSON.parse(atob(token.split('.')[1]))?.role;
    } catch {
      return null;
    }
  };

  const userRole = getRole();
  const isAdmin = userRole === 'ADMIN';
  const canManageUsers = userRole === 'ADMIN' || userRole === 'REGIONAL'; // <-- Новое условие

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
          active
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Мобильный оверлей */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Сайдбар */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-[280px] bg-slate-900 flex flex-col shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Flame className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight text-lg leading-none">GAS CONTROL</h1>
              <p className="text-blue-400/80 text-[10px] uppercase tracking-widest font-bold mt-1">System v3.0</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem to="/" icon={LayoutDashboard} label={t('dashboard', 'Обзорная панель')} />
          {canManageUsers && <NavItem to="/users" icon={Users} label={t('administrators', 'Сотрудники')} />}
          {isAdmin && <NavItem to="/audit" icon={History} label={t('audit_log', 'Журнал аудита')} />}
          {isAdmin && <NavItem to="/valves" icon={Settings2} label={t('valve_types', 'Типы клапанов')} />}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-3 shrink-0">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <select
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              value={i18n.resolvedLanguage}
              className="w-full bg-slate-800 text-slate-300 border border-transparent rounded-xl pl-9 pr-3 py-2.5 outline-none text-sm font-medium focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="ru">Русский</option>
              <option value="uz">O'zbek</option>
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl font-medium transition-all"
          >
            <LogOut size={18} /> {t('logout', 'Завершить сеанс')}
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Мобильный хедер */}
        <header className="lg:hidden h-16 bg-white flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="font-bold text-slate-800">GAS CONTROL</div>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;