import { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

const WebAppContext = createContext(null);

export const useWebApp = () => {
  const context = useContext(WebAppContext);
  if (!context) {
    throw new Error('useWebApp must be used within WebAppProvider');
  }
  return context;
};

export const WebAppProvider = ({ children }) => {
  const [webApp, setWebApp] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initTelegram = async () => {
      // Проверяем наличие Telegram Web App API
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand(); // Развернуть на весь экран
        setWebApp(tg);
        
        // Получаем initData для валидации на бэкенде
        const initData = tg.initData;
        const initDataUnsafe = tg.initDataUnsafe;
        
        if (initDataUnsafe?.user) {
          setUserInfo(initDataUnsafe.user);
        }
        
        // Отправляем initData на бэкенд для валидации и получения JWT токена
        if (initData) {
          try {
            const response = await fetch(`${API_ENDPOINTS.AUTH || 'http://localhost:8080/api/auth'}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `tma ${initData}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setToken(data.token);
              localStorage.setItem('token', data.token);
              localStorage.setItem('user_id', data.user_id);
              console.log('Authentication successful, token saved');
            } else {
              console.error('Authentication failed:', await response.text());
            }
          } catch (error) {
            console.error('Error authenticating with backend:', error);
          }
        }
        
        setIsReady(true);
      } else {
        // Для разработки без Telegram - используем моковые данные
        console.warn('Telegram Web App не обнаружен. Используются моковые данные.');
        const mockUserInfo = {
          id: 123456789,
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user',
          language_code: 'ru'
        };
        console.log('Setting mock userInfo:', mockUserInfo);
        setUserInfo(mockUserInfo);
        setIsReady(true);
      }
    };

    initTelegram();
  }, []);

  const requestContact = () => {
    if (webApp) {
      webApp.requestContact();
    }
  };

  const closeApp = () => {
    if (webApp) {
      webApp.close();
    }
  };

  const value = {
    webApp,
    userInfo,
    isReady,
    token,
    requestContact,
    closeApp,
  };

  return (
    <WebAppContext.Provider value={value}>
      {children}
    </WebAppContext.Provider>
  );
};

