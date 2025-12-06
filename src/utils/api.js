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

// Определяем, мобильное ли устройство (определяем ДО использования)
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
};

// Функция для "разогрева" сервера (cold start на Koyeb, Vercel и других платформах)
// ВАЖНО: Эта функция НЕ должна блокировать основной поток
export const warmupServer = async (baseUrl) => {
  const isMobile = isMobileDevice();
  const timeout = isMobile ? 20000 : 15000; // Уменьшено: 20s/15s вместо 30s/20s
  
  try {
    const healthUrl = `${baseUrl}/health`;
    // Логируем только в dev режиме
    if (import.meta.env.DEV === 'development') {
      console.log(`[warmupServer] Warming up (timeout: ${timeout}ms)`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const startTime = Date.now();
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    const elapsed = Date.now() - startTime;
    
    clearTimeout(timeoutId);
    
    if (response.ok && import.meta.env.DEV === 'development') {
      console.log(`[warmupServer] Warmed up in ${elapsed}ms`);
    }
  } catch (error) {
    // Игнорируем ошибки warmup - они не критичны
    // Логируем только в dev режиме
    if (import.meta.env.DEV === 'development') {
      console.warn('[warmupServer] Warmup failed (non-critical):', error.message);
    }
  }
};

// Функция для выполнения запроса с retry и увеличенными таймаутами
export const fetchWithRetry = async (
  url,
  options = {},
  maxRetries = 2, // Уменьшено с 3 до 2 для быстрой работы
  initialTimeout = 30000, // Уменьшено: 30 секунд для первого запроса (было 60)
  retryTimeout = 15000    // Уменьшено: 15 секунд для повторных попыток (было 30)
) => {
  // Для мобильных устройств увеличиваем таймауты (медленнее интернет)
  const isMobile = isMobileDevice();
  if (isMobile) {
    initialTimeout = Math.max(initialTimeout, 45000); // Уменьшено: 45 секунд для мобильных (было 90)
    retryTimeout = Math.max(retryTimeout, 25000);     // Уменьшено: 25 секунд для мобильных (было 45)
    maxRetries = Math.max(maxRetries, 3);             // Уменьшено: 3 попытки для мобильных (было 4)
    // Логируем только в dev режиме
    if (import.meta.env.DEV === 'development') {
      console.log(`[fetchWithRetry] Mobile device - timeouts: ${initialTimeout}ms/${retryTimeout}ms, ${maxRetries} retries`);
    }
  }
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId = null;
    try {
      const timeout = attempt === 0 ? initialTimeout : retryTimeout;
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Логируем только в dev режиме или при ошибках
      if (import.meta.env.DEV === 'development' && attempt === 0) {
        console.log(`[fetchWithRetry] ${url.substring(0, 50)}... (timeout: ${timeout}ms)`);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (response.ok) {
        return response;
      }
      
      // Если сервер вернул ошибку, но не таймаут - не retry
      if (response.status !== 408 && response.status !== 504 && response.status < 500) {
        return response;
      }
      
      // Для 5xx ошибок делаем retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (attempt < maxRetries) {
        const baseDelay = isMobile ? 1500 : 1000;
        const maxDelay = isMobile ? 10000 : 5000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        if (import.meta.env.DEV === 'development') {
          console.log(`[fetchWithRetry] Retrying after ${response.status} error in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      lastError = error;
      
      if (error.name === 'AbortError') {
        if (import.meta.env.DEV === 'development') {
          console.warn(`[fetchWithRetry] Timeout on attempt ${attempt + 1}`);
        }
        if (attempt < maxRetries) {
          // Уменьшены задержки для быстрой работы
          const baseDelay = isMobile ? 1500 : 1000; // Было 3000/2000
          const maxDelay = isMobile ? 10000 : 5000; // Было 20000/10000
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          if (import.meta.env.DEV === 'development') {
            console.log(`[fetchWithRetry] Retrying in ${delay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Для других ошибок (включая "Failed to fetch") тоже retry
        if (attempt < maxRetries) {
          const baseDelay = isMobile ? 1500 : 1000;
          const maxDelay = isMobile ? 10000 : 5000;
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          if (import.meta.env.DEV === 'development') {
            console.log(`[fetchWithRetry] Retrying in ${delay}ms: ${error.message}`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
  }
  
  // Улучшаем сообщение об ошибке для пользователя
  if (lastError) {
    // "Failed to fetch" обычно означает проблемы с CORS или недоступность сервера
    if (lastError.message === 'Failed to fetch' || lastError.message.includes('fetch')) {
      const friendlyError = new Error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
      friendlyError.originalError = lastError;
      throw friendlyError;
    }
    throw lastError;
  }
  
  throw new Error('Все попытки подключения не удались');
};

// Обертка для fetch с автоматической авторизацией и retry
export const fetchWithAuth = async (url, options = {}) => {
  // Определяем, используется ли Vercel (для фронтенда)
  const isVercel = typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('vercel.com') ||
    import.meta.env.VITE_VERCEL === 'true'
  );
  
  // КРИТИЧЕСКИ ВАЖНО: Warmup делаем НЕБЛОКИРУЮЩИМ (fire and forget)
  // Это позволяет приложению открываться сразу, не дожидаясь warmup
  const isFirstRequest = !window.__apiWarmedUp;
  if (isFirstRequest) {
    window.__apiWarmedUp = true;
    const baseUrl = url.split('/api/')[0] || 'http://localhost:8080';
    
    // Запускаем warmup в фоне, не блокируя основной запрос
    warmupServer(baseUrl).catch(err => {
      // Игнорируем ошибки warmup - они не критичны
      if (import.meta.env.DEV === 'development') {
        console.warn('[fetchWithAuth] Warmup failed (non-blocking):', err.message);
      }
    });
    
    // Для Vercel делаем дополнительный warmup тоже в фоне
    if (isVercel) {
      setTimeout(() => {
        warmupServer(baseUrl).catch(() => {});
      }, 500);
    }
  }
  
  // Используем retry для всех запросов
  const useRetry = options.retry !== false; // По умолчанию включен
  if (useRetry) {
    // Для Vercel используем более агрессивные настройки retry, но только для критичных запросов
    // Для обычных запросов используем стандартные настройки
    const isCriticalRequest = url.includes('/api/auth') || url.includes('/api/profiles/check');
    if (isVercel && isCriticalRequest) {
      return fetchWithRetry(url, options, 3, 60000, 30000); // Уменьшено: 3 попытки, 60s/30s
    }
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

