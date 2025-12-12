// Утилита для сохранения логов в localStorage (для просмотра с телефона без dev tools)

const MAX_LOGS = 1000; // Максимальное количество логов
const STORAGE_KEY = 'maxnet_debug_logs';

// Сохраняет лог в localStorage и отправляет на сервер (если доступен)
export const sendDebugLog = (logData) => {
  try {
    // Добавляем лог в localStorage
    const logs = getLogs();
    logs.push({
      ...logData,
      id: Date.now() + Math.random(),
    });
    
    // Ограничиваем количество логов
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    
    // Пытаемся отправить на сервер (если доступен localhost)
    try {
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(() => {
        // Игнорируем ошибки - это нормально, если сервер недоступен
      });
    } catch (e) {
      // Игнорируем ошибки отправки на сервер
    }
  } catch (error) {
    // Если localStorage переполнен, очищаем старые логи
    try {
      const logs = getLogs();
      logs.splice(0, Math.floor(logs.length / 2)); // Удаляем половину старых логов
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      // Если и это не помогло, очищаем все
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e2) {
        // Игнорируем
      }
    }
  }
};

// Получает все логи из localStorage
export const getLogs = () => {
  try {
    const logsJson = localStorage.getItem(STORAGE_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    return [];
  }
};

// Очищает все логи
export const clearLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Игнорируем ошибки
  }
};

// Экспортирует логи как JSON строку
export const exportLogs = () => {
  const logs = getLogs();
  return JSON.stringify(logs, null, 2);
};

// Экспортирует логи как текстовый файл
export const exportLogsAsFile = () => {
  const logs = getLogs();
  const text = JSON.stringify(logs, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debug-logs-${new Date().toISOString().replace(/:/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
