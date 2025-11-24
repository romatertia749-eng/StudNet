const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('REACT_APP_API_BASE_URL from env:', process.env.REACT_APP_API_BASE_URL);

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  PROFILES: `${API_BASE_URL}/api/profiles`,
  CHECK_PROFILE: (user_id) => `${API_BASE_URL}/api/profiles/check/${user_id}`,
  PROFILE_BY_USER_ID: (user_id) => `${API_BASE_URL}/api/profiles/user/${user_id}`,
  PROFILE_BY_ID: (id) => `${API_BASE_URL}/api/profiles/${id}`,
  LIKE_PROFILE: (id) => `${API_BASE_URL}/api/profiles/${id}/like`,
  PASS_PROFILE: (id) => `${API_BASE_URL}/api/profiles/${id}/pass`,
  MATCHES: `${API_BASE_URL}/api/matches`,
};

console.log('API_ENDPOINTS.PROFILES:', API_ENDPOINTS.PROFILES);

export default API_BASE_URL;

