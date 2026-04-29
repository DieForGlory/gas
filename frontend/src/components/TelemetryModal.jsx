import React, { useEffect, useState } from 'react';
import { getDeviceTelemetry } from '../services/api';
import { useTranslation } from 'react-i18next';

export default function TelemetryModal({ imei, onClose }) {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        const normalized = ts.replace(' ', 'T');
        const utcStr = normalized.endsWith('Z') || normalized.includes('+') ? normalized : normalized + 'Z';
        return new Date(utcStr).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
    };

    const fetchLogs = async (currentSkip) => {
        setLoading(true);
        try {
            const data = await getDeviceTelemetry(imei, currentSkip, LIMIT);
            if (data.length < LIMIT) {
                setHasMore(false);
            }
            setLogs(prev => currentSkip === 0 ? data : [...prev, ...data]);
        } catch (error) {
            console.error(t("Ошибка загрузки телеметрии"), error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(0);
    }, [imei]);

    const handleLoadMore = () => {
        const nextSkip = skip + LIMIT;
        setSkip(nextSkip);
        fetchLogs(nextSkip);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold">{t('История телеметрии')}: {imei}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">{t('Закрыть')}</button>
                </div>
                <div className="overflow-auto p-4 flex-grow bg-gray-50">
                    {logs.length === 0 && !loading ? (
                        <p className="text-gray-500">{t('Нет данных от устройства.')}</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="bg-white p-3 border rounded shadow-sm text-sm">
                                    <div className="flex justify-between text-xs text-gray-500 mb-2 border-b pb-1">
                                        <span className="font-mono text-blue-600">{log.topic}</span>
                                        <span>{formatTimestamp(log.timestamp)}</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto text-gray-800">
                                        {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                </div>
                            ))}
                            {hasMore && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="w-full py-2 mt-4 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? t('Загрузка...') : t('Загрузить еще')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}