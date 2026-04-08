import React, { useState } from 'react';
import { authService } from '../services/api';
import { Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.login(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError(t('invalid_credentials', 'Неверный логин или пароль'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white w-full max-w-sm sm:max-w-md rounded-[2rem] shadow-xl p-6 sm:p-8 border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SMARTVALVE</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">{t('auth_system', 'Авторизация в системе')}</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl text-sm font-bold mb-5 text-center border border-rose-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('login_placeholder', 'Логин')}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-semibold text-slate-800"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              placeholder={t('password_placeholder', 'Пароль')}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm font-semibold text-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 mt-2 disabled:opacity-50 text-sm"
          >
            {loading ? t('logging_in', 'Вход...') : t('login_button', 'ВОЙТИ')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;