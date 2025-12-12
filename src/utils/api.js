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
  // #region agent log
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:fetchWithAuth:start',message:'API request starting',data:{url,requestId,hasToken:!!getAuthToken(),method:options.method||'GET'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
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
    
    // #region agent log
    const requestDuration = Date.now() - requestStartTime;
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:fetchWithAuth:response',message:'API request response received',data:{url,requestId,status:response.status,ok:response.ok,durationMs:requestDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
    // #region agent log
    const requestDuration = Date.now() - requestStartTime;
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:fetchWithAuth:error',message:'API request error',data:{url,requestId,errorName:error.name,errorMessage:error.message,isNetworkError:error.name==='TypeError'&&error.message.includes('fetch'),durationMs:requestDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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

