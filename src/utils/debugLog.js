import { API_ENDPOINTS } from '../config/api';

/**
 * Отправляет лог на бэкенд для сохранения
 * Работает как с телефона, так и с компьютера
 */
export const sendDebugLog = (logData) => {
  // Отправляем на бэкенд асинхронно, не блокируя выполнение
  fetch(API_ENDPOINTS.DEBUG_LOG, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logData),
  }).catch(() => {
    // Игнорируем ошибки отправки логов, чтобы не ломать приложение
  });
};

/**
 * Получает логи с бэкенда
 */
export const getDebugLogs = async (sessionId = null, limit = 1000) => {
  try {
    const url = `${API_ENDPOINTS.DEBUG_GET_LOGS}?limit=${limit}${sessionId ? `&sessionId=${sessionId}` : ''}`;
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    return { logs: [], total: 0 };
  } catch (error) {
    console.error('[getDebugLogs] Error:', error);
    return { logs: [], total: 0 };
  }
};

