import { API_ENDPOINTS } from '../config/api';

/**
 * Проверяет доступность бэкенда
 * @returns {Promise<{available: boolean, url: string, error?: string}>}
 */
export const checkBackendHealth = async () => {
  // Получаем базовый URL правильно
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  const healthUrl = `${apiBaseUrl}/health`;
  
  console.log('[BackendCheck] Checking health at:', healthUrl);
  console.log('[BackendCheck] API_BASE_URL:', apiBaseUrl);
  console.log('[BackendCheck] REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Увеличил таймаут до 10 секунд
    
    console.log('[BackendCheck] Sending request...');
    const startTime = Date.now();
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      // Добавляем режим cors для обхода CORS проблем
      mode: 'cors',
    });
    
    const endTime = Date.now();
    clearTimeout(timeoutId);
    
    console.log('[BackendCheck] Response received:', {
      status: response.status,
      ok: response.ok,
      time: `${endTime - startTime}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[BackendCheck] Health check successful:', data);
      return {
        available: true,
        url: healthUrl,
        status: response.status,
        data,
      };
    } else {
      const errorText = await response.text().catch(() => '');
      console.error('[BackendCheck] Health check failed:', response.status, errorText);
      return {
        available: false,
        url: healthUrl,
        status: response.status,
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
      };
    }
  } catch (error) {
    console.error('[BackendCheck] Health check error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'AbortError') {
      return {
        available: false,
        url: healthUrl,
        error: 'Timeout - сервер не отвечает в течение 10 секунд. Проверьте доступность бэкенда.',
      };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        available: false,
        url: healthUrl,
        error: `Не удалось подключиться к ${healthUrl}.\n\nВозможные причины:\n1. Бэкенд не запущен\n2. Неправильный URL: ${apiBaseUrl}\n3. Проблемы с CORS\n4. Cloudflare Tunnel недоступен\n5. Блокировка файрволом`,
      };
    } else {
      return {
        available: false,
        url: healthUrl,
        error: `${error.name}: ${error.message}`,
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

