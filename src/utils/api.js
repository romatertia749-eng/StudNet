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

// Определяем, мобильное ли устройство
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
};

// Функция для выполнения запроса с retry и увеличенными таймаутами
export const fetchWithRetry = async (
  url,
  options = {},
  maxRetries = 3,
  initialTimeout = 60000, // 60 секунд для первого запроса (cold start)
  retryTimeout = 30000    // 30 секунд для повторных попыток
) => {
  // Для мобильных устройств увеличиваем таймауты (медленнее интернет)
  const isMobile = isMobileDevice();
  if (isMobile) {
    initialTimeout = Math.max(initialTimeout, 90000); // Минимум 90 секунд для мобильных
    retryTimeout = Math.max(retryTimeout, 45000);     // Минимум 45 секунд для мобильных
    maxRetries = Math.max(maxRetries, 4);             // Больше попыток для мобильных
    console.log(`[fetchWithRetry] Mobile device detected - using extended timeouts: ${initialTimeout}ms/${retryTimeout}ms, ${maxRetries} retries`);
  }
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
          // Для мобильных устройств увеличиваем задержку
          const baseDelay = isMobile ? 3000 : 2000;
          const maxDelay = isMobile ? 20000 : 10000;
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`[fetchWithRetry] Retrying in ${delay}ms... (mobile: ${isMobile})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Для других ошибок тоже retry
        if (attempt < maxRetries) {
          // Для мобильных устройств увеличиваем задержку
          const baseDelay = isMobile ? 3000 : 2000;
          const maxDelay = isMobile ? 20000 : 10000;
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`[fetchWithRetry] Retrying in ${delay}ms due to: ${error.message} (mobile: ${isMobile})`);
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

