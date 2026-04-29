import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Flame, User, Lock, KeyRound, Loader2, ArrowLeft } from 'lucide-react';

const PasswordReset = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const { data } = await authService.passwordResetRequest({ username });
      setResetToken(data.reset_token);
      setStep(2);
      setMessage('Код отправлен в Telegram. Действителен 10 минут.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка запроса');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      await authService.passwordResetConfirm({
        reset_token: resetToken,
        code,
        new_password: newPassword
      });
      setMessage('Пароль изменен. Перенаправление...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка подтверждения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
              <Flame className="text-amber-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Сброс пароля</h1>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-bold border border-emerald-100">{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input required type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 font-bold text-slate-700" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20}/> : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input required type="text" placeholder="Код из Telegram" value={code} onChange={e => setCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 font-bold text-slate-700" />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input required type="password" placeholder="Новый пароль" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 font-bold text-slate-700" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20}/> : 'Сохранить пароль'}
            </button>
          </form>
        )}

        <button type="button" onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider mt-4">
          <ArrowLeft size={16}/> Вернуться ко входу
        </button>
      </div>
    </div>
  );
};

export default PasswordReset;