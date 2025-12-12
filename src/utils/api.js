import API_BASE_URL from '../config/api';

export const handleApiError = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Функция для получения токена из localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Функция для создания заголовков с авторизацией
export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Обертка для fetch с автоматической авторизацией и улучшенной обработкой ошибок
export const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  // Удаляем Content-Type для FormData - браузер сам установит правильный заголовок
  if (options.body instanceof FormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: options.mode || 'cors', // Явно указываем CORS режим по умолчанию
      credentials: 'include', // Включаем cookies для CORS
    });
    
    // Логируем детали ответа для отладки
    if (!response.ok) {
      console.error('[fetchWithAuth] Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }
    
    return response;
  } catch (error) {
    // Детальное логирование ошибок сети
    console.error('[fetchWithAuth] Network error:', {
      url,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    
    // Проверяем тип ошибки
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Это ошибка сети - возможно CORS или недоступен сервер
      const apiBaseUrl = API_BASE_URL;
      throw new Error(
        `Не удалось подключиться к серверу: ${url}\n\n` +
        `Возможные причины:\n` +
        `1. Бэкенд недоступен по адресу: ${apiBaseUrl}\n` +
        `2. Проблема с CORS - проверьте FRONTEND_URL в Koyeb\n` +
        `3. Неправильная настройка переменных окружения\n` +
        `4. Блокировка файрволом или антивирусом\n\n` +
        `Проверьте консоль браузера (F12) для деталей.`
      );
    }
    
    throw error;
  }
};

