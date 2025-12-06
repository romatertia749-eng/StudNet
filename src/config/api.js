const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

if (import.meta.env.DEV) {
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
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
  USER_STATS: (user_id) => `${API_BASE_URL}/api/profiles/user/${user_id}/stats`,
  CONNECTION_FEEDBACK: `${API_BASE_URL}/api/connection-feedback`,
  CONNECTION_FEEDBACK_TYPES: `${API_BASE_URL}/api/connection-feedback/types`,
  CONNECTION_FEEDBACK_MATCH: (match_id) => `${API_BASE_URL}/api/connection-feedback/match/${match_id}`,
  GET_MATCH_ID: `${API_BASE_URL}/api/connection-feedback/match-id`,
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

if (import.meta.env.DEV) {
  console.log('API_ENDPOINTS.PROFILES:', API_ENDPOINTS.PROFILES);
}

export default API_BASE_URL;

