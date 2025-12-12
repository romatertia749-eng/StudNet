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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:loadFromLocalStorage',message:'Loading from localStorage',data:{hasLocalStorage:typeof localStorage!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    const savedMainGoal = localStorage.getItem('maxnet_main_goal');
    const savedOnboarding = localStorage.getItem('maxnet_onboarding_completed');
    const savedProfile = localStorage.getItem('mn_hasCompletedProfile');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:loadFromLocalStorage:values',message:'LocalStorage values loaded',data:{savedMainGoal:!!savedMainGoal,savedOnboarding,savedProfile,userId:localStorage.getItem('user_id')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    // ВРЕМЕННО ОТКЛЮЧЕНО: онбординг с целями
    // if (savedMainGoal) {
    //   setMainGoalState(savedMainGoal);
    // }
    // Принудительно устанавливаем онбординг как завершенный
    setHasCompletedOnboardingState(true);
    localStorage.setItem('maxnet_onboarding_completed', 'true');
    // if (savedOnboarding === 'true') {
    //   setHasCompletedOnboardingState(true);
    // }
    if (savedProfile === 'true') {
      setHasCompletedProfileState(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:loadFromLocalStorage:setProfile',message:'Setting hasCompletedProfile from localStorage',data:{savedProfile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    const oldValue = hasCompletedProfile;
    const localStorageValue = localStorage.getItem('mn_hasCompletedProfile');
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:setHasCompletedProfile',message:'hasCompletedProfile changing',data:{oldValue,newValue:value,localStorageBefore:localStorageValue,userId:userInfo?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    setHasCompletedProfileState(value);
    localStorage.setItem('mn_hasCompletedProfile', value.toString());
    // #region agent log
    const localStorageAfter = localStorage.getItem('mn_hasCompletedProfile');
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:setHasCompletedProfile:after',message:'hasCompletedProfile changed',data:{newValue:value,localStorageAfter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
  };

  useEffect(() => {
    const initTelegram = async () => {
      // #region agent log
      const initStartTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:initTelegram:start',message:'Starting Telegram WebApp initialization',data:{hasTelegram:!!window.Telegram?.WebApp,userAgent:navigator.userAgent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
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
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:initTelegram:telegram',message:'Telegram WebApp detected',data:{hasUser:!!initDataUnsafe?.user,userId:initDataUnsafe?.user?.id,initDuration:Date.now()-initStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        if (initDataUnsafe?.user) {
          console.log('Setting userInfo from Telegram:', initDataUnsafe.user);
          setUserInfo(initDataUnsafe.user);
        } else {
          console.warn('initDataUnsafe.user is missing, userInfo will be null');
        }
        
        // Показываем приложение сразу, не дожидаясь авторизации
        setIsReady(true);
        
        // Авторизация выполняется асинхронно в фоне
        if (initData) {
          const authUrl = `${API_ENDPOINTS.AUTH || 'http://localhost:8080/api/auth'}`;
          console.log('Attempting authentication to:', authUrl);
          const authStartTime = Date.now();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:auth:requestStart',message:'Authentication request starting',data:{authUrl,hasInitData:!!initData,initDataLength:initData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          fetch(authUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `tma ${initData}`
            }
          })
          .then(response => {
            // #region agent log
            const authResponseTime = Date.now() - authStartTime;
            fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:auth:response',message:'Authentication response received',data:{status:response.status,ok:response.ok,durationMs:authResponseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            console.log('Auth response status:', response.status);
            if (response.ok) {
              return response.json();
            } else {
              return response.text().then(text => {
                console.error('Auth failed, response:', text);
                throw new Error(`Authentication failed: ${response.status} - ${text}`);
              });
            }
          })
          .then(data => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:initTelegram:auth',message:'Authentication successful',data:{authDuration:Date.now()-authStartTime,userId:data.user_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            setToken(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_id', data.user_id);
            console.log('Authentication successful, token saved');
          })
          .catch(error => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:initTelegram:authError',message:'Authentication failed',data:{authDuration:Date.now()-authStartTime,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            console.error('Error authenticating with backend:', error);
            console.error('Auth URL was:', authUrl);
            console.error('This might be a CORS or connectivity issue. Check backend CORS settings.');
          });
        }
      } else {
        // For development without Telegram - use mock data
        console.warn('Telegram Web App не обнаружен. Используются моковые данные.');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WebAppContext.js:initTelegram:mock',message:'Using mock data (no Telegram)',data:{initDuration:Date.now()-initStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
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

