import React, { useState } from 'react';
import { subscriberService } from '../services/api';
import { X, Wallet, ChevronRight, CheckCircle2 } from 'lucide-react';

const BalanceModal = ({ subscriber, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      await subscriberService.updateBalance(subscriber.account_number, amount);
      setSuccess(true);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      alert(error.response?.data?.detail || "Ошибка при пополнении баланса");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
        {!success ? (
          <>
            <div className="p-8 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Пополнение</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Л/С: {subscriber.account_number}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Текущий баланс</span>
                  <Wallet size={16} className="text-blue-500" />
                </div>
                <div className="text-3xl font-black text-slate-800">
                  {subscriber.balance} <span className="text-xl text-slate-400 font-bold">₽</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Сумма пополнения</label>
                <div className="relative">
                  <input
                    autoFocus
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-5 text-2xl font-black text-blue-600 outline-none focus:border-blue-500 transition-all placeholder:text-slate-200"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl">₽</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'ОБРАБОТКА...' : (
                  <>ПОПОЛНИТЬ СЧЕТ <ChevronRight size={20} /></>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="p-12 text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Успешно!</h3>
            <p className="text-slate-500 font-medium italic">Баланс абонента обновлен</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceModal;