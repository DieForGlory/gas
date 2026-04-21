import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Flame, History, Settings2, Menu, X, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const Layout = ({ children }) => {
  const location = useLocation();
  const { t } = useTranslation();
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
  const canManageUsers = userRole === 'ADMIN' || userRole === 'REGIONAL';

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
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
      >
        <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Overlay для мобильных */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white font-black text-xl tracking-tight">
            <Flame className="text-amber-500" size={24} />
            Smart<span className="text-blue-500">Valve</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">
            {t('menu')}
          </div>
          <NavItem to="/" icon={LayoutDashboard} label={t('dashboard')} />

          {canManageUsers && (
            <NavItem to="/users" icon={Users} label={t('users')} />
          )}

          {isAdmin && (
            <>
              <NavItem to="/valve-types" icon={Settings2} label={t('valve_types')} />
              <NavItem to="/firmware" icon={Cpu} label={t('firmwares')} />
              <NavItem to="/audit" icon={History} label={t('audit')} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-4 shrink-0 bg-slate-900/50">
          <LanguageSwitcher />

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl font-medium transition-all"
          >
            <LogOut size={18} /> {t('logout')}
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
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Flame className="text-amber-500" size={20} />
            Smart<span className="text-blue-600">Valve</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Контейнер с исправленными отступами */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;