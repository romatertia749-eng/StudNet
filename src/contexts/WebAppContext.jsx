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

  // Функция для проверки существования профиля на сервере
  const checkProfileOnServer = async (userId) => {
    if (!userId) return false;
    
    try {
      const { fetchWithRetry } = await import('../utils/api');
      // Уменьшены таймауты для быстрой работы
      const response = await fetchWithRetry(
        `${API_ENDPOINTS.CHECK_PROFILE(userId)}`,
        { retry: true },
        2, // 2 попытки
        20000, // Уменьшено: 20 секунд для первого запроса (было 45)
        10000  // Уменьшено: 10 секунд для повторных (было 20)
      );
      
      if (response.ok) {
        const data = await response.json();
        const exists = data.exists === true;
        // Логируем только в dev режиме
        if (import.meta.env.DEV === 'development') {
          console.log(`[WebAppContext] Profile exists: ${exists} for user ${userId}`);
        }
        
        // Синхронизируем с localStorage
        if (exists) {
          setHasCompletedProfileState(true);
          localStorage.setItem('mn_hasCompletedProfile', 'true');
        } else {
          setHasCompletedProfileState(false);
          localStorage.setItem('mn_hasCompletedProfile', 'false');
        }
        
        return exists;
      }
    } catch (error) {
      if (import.meta.env.DEV === 'development') {
        console.error('[WebAppContext] Error checking profile:', error);
      }
      // При ошибке не меняем состояние - оставляем как есть
    }
    
    return null; // null означает, что проверка не удалась
  };

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
        
        // Логируем только в dev режиме
        if (import.meta.env.DEV === 'development') {
          console.log('Telegram WebApp initialized');
        }
        
        if (initDataUnsafe?.user) {
          setUserInfo(initDataUnsafe.user);
        } else {
          if (import.meta.env.DEV === 'development') {
            console.warn('initDataUnsafe.user is missing');
          }
        }
        
        // Показываем приложение сразу, не дожидаясь авторизации
        setIsReady(true);
        
        // Авторизация и проверка профиля выполняются асинхронно в фоне
        if (initData && initDataUnsafe?.user?.id) {
          // Используем fetchWithRetry для auth запроса с retry
          import('../utils/api').then(({ fetchWithRetry }) => {
            return fetchWithRetry(`${API_ENDPOINTS.AUTH || 'http://localhost:8080/api/auth'}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `tma ${initData}`
              }
            }, 2, 20000, 10000); // Уменьшено: 20s/10s вместо 30s/15s
          })
          .then(response => {
            if (response && response.ok) {
              return response.json();
            } else {
              throw new Error('Authentication failed');
            }
          })
          .then(data => {
            if (data) {
              setToken(data.token);
              localStorage.setItem('token', data.token);
              localStorage.setItem('user_id', data.user_id);
              if (import.meta.env.DEV === 'development') {
                console.log('Authentication successful');
              }
              
              // После успешной авторизации проверяем профиль на сервере
              return checkProfileOnServer(initDataUnsafe.user.id);
            }
          })
          .catch(error => {
            if (import.meta.env.DEV === 'development') {
              console.error('Error authenticating:', error);
            }
            // Даже при ошибке авторизации пробуем проверить профиль
            if (initDataUnsafe?.user?.id) {
              checkProfileOnServer(initDataUnsafe.user.id);
            }
          });
        } else if (initDataUnsafe?.user?.id) {
          // Если нет initData, но есть user, все равно проверяем профиль
          checkProfileOnServer(initDataUnsafe.user.id);
        }
      } else {
        // For development without Telegram - use mock data
        if (import.meta.env.DEV === 'development') {
          console.warn('Telegram Web App не обнаружен. Используются моковые данные.');
        }
        const mockUserInfo = {
          id: 123456789,
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          username: 'test_user',
          language_code: 'ru'
        };
        if (import.meta.env.DEV === 'development') {
          console.log('Setting mock userInfo');
        }
        setUserInfo(mockUserInfo);
        setIsReady(true);
        
        // Проверяем профиль для мокового пользователя
        checkProfileOnServer(mockUserInfo.id);
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

