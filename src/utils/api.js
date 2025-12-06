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

// Функция для "разогрева" сервера (cold start на Koyeb)
export const warmupServer = async (baseUrl) => {
  try {
    const healthUrl = `${baseUrl}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log('[warmupServer] Server warmed up');
  } catch (error) {
    console.warn('[warmupServer] Warmup failed, but continuing:', error);
  }
};

// Функция для выполнения запроса с retry и увеличенными таймаутами
export const fetchWithRetry = async (
  url,
  options = {},
  maxRetries = 3,
  initialTimeout = 60000, // 60 секунд для первого запроса (cold start)
  retryTimeout = 30000    // 30 секунд для повторных попыток
) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeout = attempt === 0 ? initialTimeout : retryTimeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`[fetchWithRetry] Attempt ${attempt + 1}/${maxRetries + 1} for ${url} (timeout: ${timeout}ms)`);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // Если сервер вернул ошибку, но не таймаут - не retry
      if (response.status !== 408 && response.status !== 504 && response.status < 500) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (typeof clearTimeout !== 'undefined') {
        clearTimeout(timeoutId);
      }
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.warn(`[fetchWithRetry] Request timeout on attempt ${attempt + 1}`);
        if (attempt < maxRetries) {
          // Экспоненциальная задержка: 2s, 4s, 8s
          const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
          console.log(`[fetchWithRetry] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Для других ошибок тоже retry
        if (attempt < maxRetries) {
          const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
          console.log(`[fetchWithRetry] Retrying in ${delay}ms due to: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
};

// Обертка для fetch с автоматической авторизацией и retry
export const fetchWithAuth = async (url, options = {}) => {
  // Если это первый запрос после загрузки страницы, пробуем разогреть сервер
  const isFirstRequest = !window.__apiWarmedUp;
  if (isFirstRequest) {
    window.__apiWarmedUp = true;
    const baseUrl = url.split('/api/')[0] || 'http://localhost:8080';
    await warmupServer(baseUrl);
  }
  
  // Используем retry для всех запросов
  const useRetry = options.retry !== false; // По умолчанию включен
  if (useRetry) {
    return fetchWithRetry(url, options);
  }
  
  // Если retry отключен, используем обычный fetch
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

