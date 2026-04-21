import React, { useEffect, useState } from 'react';
import { valveTypeService } from '../services/api';
import { Settings, Plus, Activity, Trash2, Edit2, Check, X } from 'lucide-react';

const ValveTypesPage = () => {
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState({ id: '', name: '', response_time: 1000 });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', response_time: 1000 });

  const fetchTypes = async () => {
    try {
      const { data } = await valveTypeService.getAll();
      setTypes(data);
    } catch (error) {}
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await valveTypeService.create({ ...newType, id: Number(newType.id) });
      setNewType({ id: '', name: '', response_time: 1000 });
      fetchTypes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка создания');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await valveTypeService.update(id, { id, ...editData });
      setEditingId(null);
      fetchTypes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка обновления');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удаление невозможно, если тип используется устройствами. Продолжить?')) return;
    try {
      await valveTypeService.delete(id);
      fetchTypes();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2.5 rounded-xl"><Settings className="text-white" size={24} /></div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Типы клапанов</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">ID Типа</label>
            <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-sm font-bold" value={newType.id} onChange={e => setNewType({...newType, id: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Название</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-sm font-bold" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Отклик (мс)</label>
            <input required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-sm font-bold" value={newType.response_time} onChange={e => setNewType({...newType, response_time: e.target.value})} />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 text-sm transition-all shadow-sm">
            <Plus size={18} /> Добавить
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="col-span-10">Конфигурация типа</div>
          <div className="col-span-2 text-right">Управление</div>
        </div>
        <div className="divide-y divide-slate-100">
          {types.map(vt => (
            <div key={vt.id} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
              {editingId === vt.id ? (
                <div className="col-span-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <input type="number" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-mono font-bold" value={editData.response_time} onChange={e => setEditData({...editData, response_time: e.target.value})} />
                </div>
              ) : (
                <div className="col-span-10 flex items-center gap-3">
                  <Activity size={16} className="text-blue-500" />
                  <span className="font-bold text-slate-800 text-sm">
                    <span className="text-slate-400 font-mono mr-2">#{vt.id}</span>
                    {vt.name}
                    <span className="ml-3 text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600 font-mono">{vt.response_time} мс</span>
                  </span>
                </div>
              )}
              <div className="col-span-2 flex items-center justify-end gap-2">
                {editingId === vt.id ? (
                  <>
                    <button onClick={() => handleUpdate(vt.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Check size={18}/></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X size={18}/></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(vt.id); setEditData({ name: vt.name, response_time: vt.response_time }); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(vt.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </>
                )}
              </div>
            </div>
          ))}
          {types.length === 0 && <div className="text-center py-16 text-slate-400 font-bold italic">Типы не заданы</div>}
        </div>
      </div>
    </div>
  );
};

export default ValveTypesPage;