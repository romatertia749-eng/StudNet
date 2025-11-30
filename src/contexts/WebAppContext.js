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
  const [mainGoal, setMainGoalState] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfileState] = useState(false);

  // Загрузка онбординга из localStorage при инициализации
  useEffect(() => {
    const savedMainGoal = localStorage.getItem('maxnet_main_goal');
    const savedOnboarding = localStorage.getItem('maxnet_onboarding_completed');
    const savedProfile = localStorage.getItem('mn_hasCompletedProfile');
    
    if (savedMainGoal) {
      setMainGoalState(savedMainGoal);
    }
    if (savedOnboarding === 'true') {
      setHasCompletedOnboardingState(true);
    }
    if (savedProfile === 'true') {
      setHasCompletedProfileState(true);
    }
  }, []);

  const setMainGoal = (goal) => {
    setMainGoalState(goal);
    localStorage.setItem('maxnet_main_goal', goal);
  };

  const setHasCompletedOnboarding = (value) => {
    setHasCompletedOnboardingState(value);
    localStorage.setItem('maxnet_onboarding_completed', value.toString());
  };

  const setHasCompletedProfile = (value) => {
    setHasCompletedProfileState(value);
    localStorage.setItem('mn_hasCompletedProfile', value.toString());
  };

  useEffect(() => {
    let viewportChangedHandler = null;
    let readyHandler = null;
    let tg = null;
    
    const initTelegram = async () => {
      // Проверяем наличие Telegram Web App API
      if (window.Telegram?.WebApp?.initDataUnsafe) {
        tg = window.Telegram.WebApp;
        
        // Инициализация Telegram WebApp
        tg.ready();
        
        // Full-screen mode: Telegram Web App API v6.0+
        // Скрываем шапку Telegram и переходим в полноэкранный режим
        // Важно: вызывать expand() сразу после ready(), синхронно
        
        // Функция для принудительного скрытия шапки
        const forceExpand = () => {
          if (typeof tg.expand === 'function') {
            tg.expand();
            console.log('Telegram WebApp: expand() called, isExpanded:', tg.isExpanded);
          }
          // Устанавливаем прозрачный цвет шапки
          if (typeof tg.setHeaderColor === 'function') {
            tg.setHeaderColor('#00000000'); // Прозрачный цвет
            console.log('Telegram WebApp: setHeaderColor(transparent) called');
          }
          // Скрываем кнопку "Назад" если она есть
          if (tg.BackButton && typeof tg.BackButton.hide === 'function') {
            tg.BackButton.hide();
          }
          // Используем setBackgroundColor для полного контроля
          if (typeof tg.setBackgroundColor === 'function') {
            tg.setBackgroundColor('#000000');
          }
          // Проверяем версию API
          console.log('Telegram WebApp version:', tg.version);
          console.log('Telegram WebApp platform:', tg.platform);
        };
        
        // Вызываем сразу
        forceExpand();
        
        // Request full viewport for proper full-screen handling
        // This enables viewportChanged events and safe area insets
        if (typeof tg.requestViewport === 'function') {
          tg.requestViewport();
        }
        
        // Повторные попытки скрыть шапку с задержками
        // Иногда нужно вызвать несколько раз для полного скрытия
        setTimeout(forceExpand, 50);
        setTimeout(forceExpand, 150);
        setTimeout(forceExpand, 300);
        
        // Подписываемся на событие ready для повторного вызова expand()
        if (typeof tg.onEvent === 'function') {
          readyHandler = forceExpand;
          tg.onEvent('ready', readyHandler);
        }
        
        setWebApp(tg);
        
        // Обновление CSS custom properties для viewport и safe areas
        // Читаем значения напрямую из объекта tg (API 6.0+)
        const updateViewportStyles = () => {
          const root = document.documentElement;
          
          // Читаем viewport height и stable height напрямую из tg
          const viewportHeight = tg.viewportHeight || window.innerHeight;
          const viewportStableHeight = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight;
          
          // Читаем безопасные отступы из contentSafeAreaInset (API 6.0+)
          const safeArea = tg.contentSafeAreaInset || { top: 0, bottom: 0 };
          const safeAreaTop = safeArea.top || 0;
          const safeAreaBottom = safeArea.bottom || 0;
          
          // Устанавливаем CSS custom properties на document.documentElement
          root.style.setProperty('--tg-viewport-height', `${viewportHeight}px`);
          root.style.setProperty('--tg-viewport-stable-height', `${viewportStableHeight}px`);
          root.style.setProperty('--tg-safe-area-top', `${safeAreaTop}px`);
          root.style.setProperty('--tg-safe-area-bottom', `${safeAreaBottom}px`);
        };
        
        // Подписка на событие viewportChanged (API 6.0+)
        if (typeof tg.onEvent === 'function') {
          // Обработчик события viewportChanged
          // Событие не передает параметры, нужно читать свойства напрямую из tg
          viewportChangedHandler = () => {
            updateViewportStyles();
          };
          
          tg.onEvent('viewportChanged', viewportChangedHandler);
          
          // Устанавливаем начальные значения сразу после подписки
          updateViewportStyles();
        } else {
          // Fallback для старых версий API
          const root = document.documentElement;
          root.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
          root.style.setProperty('--tg-viewport-stable-height', `${window.innerHeight}px`);
          root.style.setProperty('--tg-safe-area-top', '0px');
          root.style.setProperty('--tg-safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
        }
        
        // Get initData for backend validation
        const initData = tg.initData;
        const initDataUnsafe = tg.initDataUnsafe;
        
        console.log('Telegram WebApp initialized with full-screen mode');
        console.log('initDataUnsafe:', initDataUnsafe);
        console.log('initDataUnsafe.user:', initDataUnsafe?.user);
        
        if (initDataUnsafe?.user) {
          console.log('Setting userInfo from Telegram:', initDataUnsafe.user);
          setUserInfo(initDataUnsafe.user);
        } else {
          console.warn('initDataUnsafe.user is missing, userInfo will be null');
        }
        
        // Send initData to backend for validation and JWT token
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
        // For development without Telegram - use mock data
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
        
        // Set fallback CSS variables for development
        const root = document.documentElement;
        root.style.setProperty('--tg-viewport-height', '100vh');
        root.style.setProperty('--tg-viewport-stable-height', '100vh');
        root.style.setProperty('--tg-safe-area-top', '0px');
        root.style.setProperty('--tg-safe-area-bottom', '0px');
        
        setIsReady(true);
      }
    };

    initTelegram();
    
    // Cleanup function to remove event listener on unmount
    return () => {
      if (tg && typeof tg.offEvent === 'function') {
        if (viewportChangedHandler) {
          tg.offEvent('viewportChanged', viewportChangedHandler);
        }
        if (readyHandler) {
          tg.offEvent('ready', readyHandler);
        }
      }
    };
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
    mainGoal,
    hasCompletedOnboarding,
    hasCompletedProfile,
    setMainGoal,
    setHasCompletedOnboarding,
    setHasCompletedProfile,
    requestContact,
    closeApp,
  };

  return (
    <WebAppContext.Provider value={value}>
      {children}
    </WebAppContext.Provider>
  );
};

