import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, KeyRound, Loader2, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1';

const Verify2FA = ({ setToken }) => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const tempToken = localStorage.getItem('temp_token');
    if (!tempToken) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await axios.post(`${API_URL}/auth/verify-2fa`, {
        token: tempToken,
        code: code
      });

      localStorage.removeItem('temp_token');
      localStorage.setItem('token', data.access_token);
      if (setToken) setToken(data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный код подтверждения');
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
              <ShieldCheck className="text-blue-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Подтверждение входа</h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Введите код из Telegram
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 animate-shake">
              {error}
            </div>
          )}

          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              required
              maxLength={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 transition-all font-mono font-bold text-slate-700 text-center tracking-widest text-lg"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Подтвердить'}
          </button>
        </form>

        <button
          onClick={() => {
            localStorage.removeItem('temp_token');
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider mt-4"
        >
          <ArrowLeft size={16}/> Вернуться
        </button>
      </div>
    </div>
  );
};

export default Verify2FA;