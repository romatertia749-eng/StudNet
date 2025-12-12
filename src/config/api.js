// В Create React App переменные окружения должны начинаться с REACT_APP_
// Они встраиваются в код во время сборки (build time), не runtime!
// В Vercel: Settings → Environment Variables → добавить REACT_APP_API_BASE_URL
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Fallback для production: если переменная не установлена, используем Koyeb URL
if (!API_BASE_URL || API_BASE_URL === 'undefined' || API_BASE_URL === '') {
  if (process.env.NODE_ENV === 'production') {
    // В production используем Koyeb URL по умолчанию
    API_BASE_URL = 'https://unique-reptile-dk-it1-69845c61.koyeb.app';
  } else {
    // В development используем localhost
    API_BASE_URL = 'http://localhost:8080';
  }
}

// Нормализация URL: добавляем протокол, если отсутствует
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  // Если переменная установлена без протокола (например, только домен)
  API_BASE_URL = `https://${API_BASE_URL}`;
}

// Убираем trailing slash, если есть
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}

console.log('=== API CONFIG DEBUG ===');
console.log('REACT_APP_API_BASE_URL (raw):', process.env.REACT_APP_API_BASE_URL);
console.log('REACT_APP_API_BASE_URL (type):', typeof process.env.REACT_APP_API_BASE_URL);
console.log('REACT_APP_API_BASE_URL (length):', process.env.REACT_APP_API_BASE_URL?.length);
console.log('API_BASE_URL (normalized):', API_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All REACT_APP_ vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));

// Предупреждение, если используется localhost в продакшене
if (process.env.NODE_ENV === 'production' && API_BASE_URL.includes('localhost')) {
  console.error('❌ ERROR: API_BASE_URL points to localhost in production!');
  console.error('This will not work! Set REACT_APP_API_BASE_URL in Vercel:');
  console.error('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.error('2. Add: REACT_APP_API_BASE_URL = https://your-koyeb-app.koyeb.app');
  console.error('3. Redeploy the project');
  // В production это критическая ошибка, но не можем остановить приложение
  // Пользователь увидит ошибки в консоли и в UI
}

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth/`, // Со слэшем для надежности
  PROFILES: `${API_BASE_URL}/api/profiles/`, // Со слэшем для надежности
  CHECK_PROFILE: (user_id) => `${API_BASE_URL}/api/profiles/check/${user_id}`,
  PROFILE_BY_USER_ID: (user_id) => `${API_BASE_URL}/api/profiles/user/${user_id}`,
  PROFILE_BY_ID: (id) => `${API_BASE_URL}/api/profiles/${id}`,
  LIKE_PROFILE: (id) => `${API_BASE_URL}/api/profiles/${id}/like`,
  PASS_PROFILE: (id) => `${API_BASE_URL}/api/profiles/${id}/pass`,
  MATCHES: `${API_BASE_URL}/api/matches`,
  INCOMING_LIKES: `${API_BASE_URL}/api/profiles/incoming-likes`,
  RESPOND_TO_LIKE: `${API_BASE_URL}/api/likes/respond`,
};

// Функция для формирования полного URL фотографии
export const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  // Если уже полный URL (начинается с http), возвращаем как есть
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  // Если относительный путь (старый формат), добавляем базовый URL бэкенда
  if (photoPath.startsWith('/')) {
    return `${API_BASE_URL}${photoPath}`;
  }
  // Если путь без слэша, добавляем /uploads/photos/
  return `${API_BASE_URL}/uploads/photos/${photoPath}`;
};

console.log('API_ENDPOINTS.PROFILES:', API_ENDPOINTS.PROFILES);

export default API_BASE_URL;

