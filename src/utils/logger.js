// Утилита для логирования - автоматически отключается в production
export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Ошибки всегда логируем
    console.error(...args);
  },
  info: (...args) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
};

