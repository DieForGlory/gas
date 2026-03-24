import React, { useState } from 'react';
import { deviceService } from '../services/api';

const BalanceModal = ({ subscriber, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await deviceService.updateBalance(subscriber.account_number, parseFloat(amount)); // Ссылка на эндпоинт пополнения
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4">Пополнение баланса</h3>
        <p className="text-sm text-gray-500 mb-4">{subscriber.name} ({subscriber.account_number})</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number" step="0.01" required
            className="w-full border p-3 rounded-xl"
            placeholder="Сумма пополнения (₽)"
            value={amount} onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold">Отмена</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Пополнить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BalanceModal;