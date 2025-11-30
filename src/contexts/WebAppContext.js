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
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
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

  // Загрузка фонового изображения
  useEffect(() => {
    let isMounted = true;
    
    // Создаем изображение с максимальным приоритетом
    const img = new Image();
    img.src = '/assets/stuff/background.jpg';
    if (img.fetchPriority !== undefined) {
      img.fetchPriority = 'high';
    }
    
    // Пытаемся загрузить сразу
    img.onload = () => {
      if (isMounted) {
        // Небольшая задержка для полного рендеринга
        setTimeout(() => {
          if (isMounted) {
            setBackgroundLoaded(true);
          }
        }, 50);
      }
    };
    img.onerror = () => {
      // Если не загрузилось, все равно показываем приложение
      if (isMounted) {
        setBackgroundLoaded(true);
      }
    };
    
    // Дополнительная попытка через небольшую задержку
    const timeoutId = setTimeout(() => {
      if (isMounted && !img.complete) {
        const img2 = new Image();
        img2.src = '/assets/stuff/background.jpg';
        if (img2.fetchPriority !== undefined) {
          img2.fetchPriority = 'high';
        }
        img2.onload = () => {
          if (isMounted) {
            setTimeout(() => {
              if (isMounted) setBackgroundLoaded(true);
            }, 50);
          }
        };
        img2.onerror = () => {
          if (isMounted) setBackgroundLoaded(true);
        };
      }
    }, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const initTelegram = async () => {
      // Проверяем наличие Telegram Web App API
      if (window.Telegram?.WebApp?.initDataUnsafe) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        setWebApp(tg);
        
        // Get initData for backend validation
        const initData = tg.initData;
        const initDataUnsafe = tg.initDataUnsafe;
        
        console.log('Telegram WebApp initialized');
        console.log('initDataUnsafe:', initDataUnsafe);
        console.log('initDataUnsafe.user:', initDataUnsafe?.user);
        
        if (initDataUnsafe?.user) {
          console.log('Setting userInfo from Telegram:', initDataUnsafe.user);
          setUserInfo(initDataUnsafe.user);
        } else {
          console.warn('initDataUnsafe.user is missing, userInfo will be null');
        }
        
        // Показываем приложение только после загрузки фона
        // Проверка будет в условии рендера
        
        // Авторизация выполняется асинхронно в фоне
        if (initData) {
          fetch(`${API_ENDPOINTS.AUTH || 'http://localhost:8080/api/auth'}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `tma ${initData}`
            }
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('Authentication failed');
            }
          })
          .then(data => {
            setToken(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_id', data.user_id);
            console.log('Authentication successful, token saved');
          })
          .catch(error => {
            console.error('Error authenticating with backend:', error);
          });
        }
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
      }
      
      // Устанавливаем isReady после инициализации Telegram
      setIsReady(true);
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

  // Приложение готово только когда и Telegram инициализирован, И фон загружен
  const isFullyReady = isReady && backgroundLoaded;

  const value = {
    webApp,
    userInfo,
    isReady: isFullyReady,
    backgroundLoaded,
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

