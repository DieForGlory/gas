import React, { useState, useEffect } from 'react';
import { firmwareService, valveTypeService, deviceService } from '../services/api';
import { UploadCloud, Cpu, RefreshCw } from 'lucide-react';

export default function Firmware() {
    const [firmwares, setFirmwares] = useState([]);
    const [valveTypes, setValveTypes] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedFirmware, setSelectedFirmware] = useState(null);
    const [selectedDevices, setSelectedDevices] = useState([]);

    // Форма загрузки
    const [version, setVersion] = useState('');
    const [vType, setVType] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [fwRes, vtRes, devRes] = await Promise.all([
            firmwareService.getAll(),
            valveTypeService.getAll(),
            deviceService.getAll() // Убедитесь, что этот метод возвращает все устройства для админа
        ]);
        setFirmwares(fwRes.data);
        setValveTypes(vtRes.data);
        setDevices(devRes.data);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !version || !vType) return alert('Заполните все поля');

        const formData = new FormData();
        formData.append('version', version);
        formData.append('valve_type_id', vType);
        formData.append('file', file);

        setUploading(true);
        try {
            await firmwareService.upload(formData);
            setVersion(''); setFile(null);
            loadData();
        } catch (error) {
            alert('Ошибка загрузки');
        } finally {
            setUploading(false);
        }
    };

    const handleOTA = async () => {
        if (!selectedFirmware || selectedDevices.length === 0) return alert('Выберите прошивку и устройства');
        if (!window.confirm(`Запустить обновление для ${selectedDevices.length} устройств?`)) return;

        try {
            await firmwareService.triggerOTA(selectedFirmware.id, selectedDevices);
            alert('Команды OTA отправлены');
            setSelectedDevices([]);
            setSelectedFirmware(null);
        } catch (error) {
            alert('Ошибка отправки OTA');
        }
    };

    const compatibleDevices = devices.filter(d => selectedFirmware && d.valve_type === selectedFirmware.valve_type_id);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Cpu /> OTA Обновления
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Загрузка */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Загрузить прошивку</h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <input type="text" placeholder="Версия (напр. 1.0.5)" value={version} onChange={e => setVersion(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono text-sm outline-none" required />
                        <select value={vType} onChange={e => setVType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" required>
                            <option value="">Выберите тип клапана</option>
                            {valveTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                        </select>
                        <input type="file" accept=".bin" onChange={e => setFile(e.target.files[0])} className="w-full text-sm" required />
                        <button disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl flex justify-center items-center gap-2">
                            {uploading ? 'Загрузка...' : <><UploadCloud size={18} /> Загрузить</>}
                        </button>
                    </form>
                </div>

                {/* Список и Запуск */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Доступные прошивки</h2>
                    <div className="flex-1 overflow-auto border rounded-xl mb-4">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3">Версия</th>
                                    <th className="p-3">Тип</th>
                                    <th className="p-3">Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {firmwares.map(fw => (
                                    <tr key={fw.id} className={`border-b ${selectedFirmware?.id === fw.id ? 'bg-blue-50' : ''}`}>
                                        <td className="p-3 font-mono font-bold">{fw.version}</td>
                                        <td className="p-3">{valveTypes.find(t => t.id === fw.valve_type_id)?.name}</td>
                                        <td className="p-3">
                                            <button onClick={() => { setSelectedFirmware(fw); setSelectedDevices([]); }} className="text-blue-600 font-bold hover:underline">Выбрать</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {selectedFirmware && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold mb-2">Совместимых устройств: {compatibleDevices.length}</p>
                            <div className="max-h-32 overflow-auto bg-white border rounded p-2 mb-3">
                                {compatibleDevices.map(d => (
                                    <label key={d.imei} className="flex items-center gap-2 text-sm p-1 hover:bg-slate-50">
                                        <input type="checkbox" checked={selectedDevices.includes(d.imei)} onChange={e => {
                                            if (e.target.checked) setSelectedDevices([...selectedDevices, d.imei]);
                                            else setSelectedDevices(selectedDevices.filter(id => id !== d.imei));
                                        }} />
                                        <span className="font-mono">{d.imei}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedDevices(compatibleDevices.map(d => d.imei))} className="text-xs bg-slate-200 px-2 py-1 rounded font-bold hover:bg-slate-300">Выбрать все</button>
                                <button onClick={handleOTA} disabled={selectedDevices.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl flex justify-center items-center gap-2 uppercase tracking-widest text-xs">
                                    <RefreshCw size={14} /> Начать обновление
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}