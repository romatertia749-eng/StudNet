import { API_ENDPOINTS } from '../config/api';

/**
 * Проверяет доступность бэкенда
 * @returns {Promise<{available: boolean, url: string, error?: string}>}
 */
export const checkBackendHealth = async () => {
  const healthUrl = `${API_ENDPOINTS.PROFILES.replace('/api/profiles/', '')}/health`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        url: healthUrl,
        status: response.status,
        data,
      };
    } else {
      return {
        available: false,
        url: healthUrl,
        status: response.status,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        available: false,
        url: healthUrl,
        error: 'Timeout - сервер не отвечает в течение 5 секунд',
      };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        available: false,
        url: healthUrl,
        error: 'Не удалось подключиться. Возможные причины:\n' +
               '1. Бэкенд не запущен\n' +
               '2. Неправильный URL в REACT_APP_API_BASE_URL\n' +
               '3. Проблемы с CORS\n' +
               '4. Блокировка файрволом',
      };
    } else {
      return {
        available: false,
        url: healthUrl,
        error: error.message || 'Неизвестная ошибка',
      };
    }
  }
};

/**
 * Проверяет доступность конкретного эндпоинта
 * @param {string} endpoint - URL эндпоинта
 * @returns {Promise<{available: boolean, error?: string}>}
 */
export const checkEndpoint = async (endpoint) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return {
      available: response.ok || response.status === 401 || response.status === 404,
      status: response.status,
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
};

/**
 * Получает информацию о текущей конфигурации API
 */
export const getApiConfig = () => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  const isLocalhost = apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1');
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    apiBaseUrl,
    isLocalhost,
    isProduction,
    hasEnvVar: !!process.env.REACT_APP_API_BASE_URL,
    endpoints: {
      health: `${apiBaseUrl}/health`,
      profiles: API_ENDPOINTS.PROFILES,
      matches: API_ENDPOINTS.MATCHES,
    },
  };
};

