import { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { getLogs, clearLogs, exportLogsAsFile, exportLogs } from '../utils/debugLog';

const DebugLogs = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedHypothesis, setSelectedHypothesis] = useState('all');

  useEffect(() => {
    const loadLogs = () => {
      const allLogs = getLogs();
      setLogs(allLogs);
    };
    
    loadLogs();
    const interval = setInterval(loadLogs, 2000); // Обновляем каждые 2 секунды
    
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || 
      log.message?.toLowerCase().includes(filter.toLowerCase()) ||
      log.location?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesHypothesis = selectedHypothesis === 'all' || 
      log.hypothesisId === selectedHypothesis;
    
    return matchesFilter && matchesHypothesis;
  });

  const hypothesisIds = [...new Set(logs.map(log => log.hypothesisId).filter(Boolean))];

  const handleCopy = () => {
    const text = exportLogs();
    navigator.clipboard.writeText(text).then(() => {
      alert('Логи скопированы в буфер обмена!');
    }).catch(() => {
      alert('Не удалось скопировать. Попробуйте экспортировать файл.');
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Debug Logs</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Поиск по сообщению или location..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={selectedHypothesis}
            onChange={(e) => setSelectedHypothesis(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Все гипотезы</option>
            {hypothesisIds.map(id => (
              <option key={id} value={id}>Гипотеза {id}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={handleCopy} className="text-sm">
            📋 Копировать
          </Button>
          <Button variant="outline" onClick={exportLogsAsFile} className="text-sm">
            💾 Экспорт файла
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              if (confirm('Очистить все логи?')) {
                clearLogs();
                setLogs([]);
              }
            }} 
            className="text-sm text-red-600"
          >
            🗑️ Очистить
          </Button>
          <div className="ml-auto text-sm text-gray-600">
            Всего: {logs.length} | Показано: {filteredLogs.length}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
          {filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Логи не найдены</p>
          ) : (
            <div className="space-y-2">
              {filteredLogs.slice().reverse().map((log, index) => (
                <div
                  key={log.id || index}
                  className="bg-white p-3 rounded border border-gray-200 text-xs font-mono"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {log.location || 'unknown'}
                      </div>
                      <div className="text-gray-600 mt-1">{log.message}</div>
                    </div>
                    <div className="text-gray-400 ml-2">
                      {formatTime(log.timestamp)}
                      {log.hypothesisId && (
                        <span className="ml-2 px-1 bg-blue-100 text-blue-700 rounded">
                          H{log.hypothesisId}
                        </span>
                      )}
                    </div>
                  </div>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Данные
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DebugLogs;

