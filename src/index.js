import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { WebAppProvider } from './contexts/WebAppContext';
import { MatchProvider } from './contexts/MatchContext';

// #region agent log
const appStartTime = Date.now();
fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:appStart',message:'Application starting',data:{hasTelegram:!!window.Telegram?.WebApp,userAgent:navigator.userAgent,connectionType:navigator.connection?.effectiveType||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// ВРЕМЕННО ОТКЛЮЧЕНО: Предзагрузка фона (9MB - может вызывать проблемы производительности)
// КРИТИЧЕСКИ ВАЖНО: Предзагрузка фона ДО рендера React для максимальной скорости
// Это позволяет браузеру начать загрузку фона еще до того, как React загрузится
/* ОРИГИНАЛЬНЫЙ КОД - ЗАКОММЕНТИРОВАН
if (typeof window !== 'undefined') {
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.href = '/assets/stuff/background.jpg';
  preloadLink.as = 'image';
  preloadLink.setAttribute('fetchpriority', 'high');
  preloadLink.crossOrigin = 'anonymous';
  document.head.appendChild(preloadLink);
  
  // Дополнительно: создаем Image объект для еще более ранней загрузки
  const img = new Image();
  img.src = '/assets/stuff/background.jpg';
  if (img.fetchPriority !== undefined) {
    img.fetchPriority = 'high';
  }
}
*/

// Глобальная обработка ошибок - скрываем 404 ошибки от пользователя
window.addEventListener('error', (event) => {
  // #region agent log
  if (event.target && event.target.tagName) {
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:resourceError',message:'Resource load error',data:{tagName:event.target.tagName,src:event.target.src||event.target.href||'unknown',errorMessage:event.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion
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

// #region agent log
const renderStartTime = Date.now();
fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:renderStart',message:'React render starting',data:{timeSinceAppStart:Date.now()-appStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

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

// #region agent log
setTimeout(() => {
  fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.js:renderComplete',message:'React render complete',data:{renderDuration:Date.now()-renderStartTime,totalDuration:Date.now()-appStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
}, 100);
// #endregion

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
