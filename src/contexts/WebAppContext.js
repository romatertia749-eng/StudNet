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
      const response = await fetchWithRetry(
        `${API_ENDPOINTS.CHECK_PROFILE(userId)}`,
        { retry: true },
        2, // 2 попытки
        45000, // 45 секунд для первого запроса
        20000  // 20 секунд для повторных
      );
      
      if (response.ok) {
        const data = await response.json();
        const exists = data.exists === true;
        console.log(`[WebAppContext] Profile exists on server: ${exists} for user ${userId}`);
        
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
      console.error('[WebAppContext] Error checking profile on server:', error);
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
        
        console.log('Telegram WebApp initialized');
        console.log('initDataUnsafe:', initDataUnsafe);
        console.log('initDataUnsafe.user:', initDataUnsafe?.user);
        
        if (initDataUnsafe?.user) {
          console.log('Setting userInfo from Telegram:', initDataUnsafe.user);
          setUserInfo(initDataUnsafe.user);
        } else {
          console.warn('initDataUnsafe.user is missing, userInfo will be null');
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
            }, 2, 30000, 15000); // 2 попытки для auth, 30s первый таймаут
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
              console.log('Authentication successful, token saved');
              
              // После успешной авторизации проверяем профиль на сервере
              return checkProfileOnServer(initDataUnsafe.user.id);
            }
          })
          .catch(error => {
            console.error('Error authenticating with backend:', error);
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

