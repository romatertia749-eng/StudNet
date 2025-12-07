import { useState, useEffect } from 'react';
import { checkBackendHealth, getApiConfig } from '../utils/backendCheck';
import Card from './Card';

const BackendStatus = ({ onClose }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const config = getApiConfig();

  useEffect(() => {
    const check = async () => {
      setLoading(true);
      const result = await checkBackendHealth();
      setStatus(result);
      setLoading(false);
    };
    
    check();
  }, []);

  if (loading) {
    return (
      <Card className="mt-4">
        <p className="text-center text-gray-800 py-4">Проверка подключения к серверу...</p>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Статус подключения к серверу</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Статус подключения */}
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${status?.available ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium text-gray-800">
              {status?.available ? 'Сервер доступен' : 'Сервер недоступен'}
            </span>
          </div>

          {/* URL */}
          <div>
            <p className="text-sm text-gray-600 mb-1">URL сервера:</p>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">{config.apiBaseUrl}</p>
          </div>

          {/* Предупреждения */}
          {config.isLocalhost && config.isProduction && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Используется localhost в продакшене. Установите переменную окружения REACT_APP_API_BASE_URL.
              </p>
            </div>
          )}

          {!config.hasEnvVar && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 Создайте файл .env в корне проекта со строкой:
              </p>
              <p className="text-xs font-mono bg-blue-100 p-2 rounded mt-2">
                REACT_APP_API_BASE_URL=http://localhost:8080
              </p>
            </div>
          )}

          {/* Ошибка */}
          {status && !status.available && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-800 mb-2">Ошибка подключения:</p>
              <p className="text-sm text-red-700 whitespace-pre-line">{status.error}</p>
              {status.url && (
                <p className="text-xs text-red-600 mt-2">
                  Проверяемый URL: {status.url}
                </p>
              )}
            </div>
          )}

          {/* Успех */}
          {status?.available && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                ✅ Сервер отвечает корректно
              </p>
              {status.status && (
                <p className="text-xs text-green-600 mt-1">
                  HTTP Status: {status.status}
                </p>
              )}
            </div>
          )}

          {/* Эндпоинты */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Доступные эндпоинты:</p>
            <div className="space-y-1 text-xs font-mono">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-600">Health:</span> {config.endpoints.health}
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-600">Profiles:</span> {config.endpoints.profiles}
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-600">Matches:</span> {config.endpoints.matches}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BackendStatus;

