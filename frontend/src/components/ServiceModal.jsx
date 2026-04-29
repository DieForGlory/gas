import React from 'react';
import { X } from 'lucide-react';

const ServiceModal = ({ device, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
            Сервисный ответ: {device.imei}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-slate-900 flex-1">
          <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap break-words">
            {JSON.stringify(device, null, 2)}
          </pre>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-slate-900 transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;