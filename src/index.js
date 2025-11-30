import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { WebAppProvider } from './contexts/WebAppContext';
import { MatchProvider } from './contexts/MatchContext';

// Ранняя инициализация Telegram WebApp для скрытия шапки
// Вызываем expand() как можно раньше, до рендера React
const initTelegramEarly = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    // Сразу вызываем expand() для скрытия шапки
    if (typeof tg.expand === 'function') {
      tg.expand();
    }
    // Устанавливаем прозрачный цвет шапки
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#00000000');
    }
    // Скрываем кнопку "Назад"
    if (tg.BackButton && typeof tg.BackButton.hide === 'function') {
      tg.BackButton.hide();
    }
  }
};

// Пытаемся инициализировать сразу
initTelegramEarly();

// Также инициализируем после загрузки DOM на случай, если скрипт загрузился позже
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTelegramEarly);
} else {
  // DOM уже загружен, но скрипт может загрузиться позже
  setTimeout(initTelegramEarly, 0);
}

// Глобальная обработка ошибок - скрываем 404 ошибки от пользователя
window.addEventListener('error', (event) => {
  // Игнорируем ошибки загрузки ресурсов (изображения, скрипты и т.д.)
  if (event.target && event.target.tagName) {
    event.preventDefault();
    return false;
  }
});

// Перехватываем необработанные промисы
window.addEventListener('unhandledrejection', (event) => {
  // Игнорируем ошибки 404, которые являются нормальными (профиль не найден)
  if (event.reason && event.reason.status === 404) {
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WebAppProvider>
      <MatchProvider>
        <App />
      </MatchProvider>
    </WebAppProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
