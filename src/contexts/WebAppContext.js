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
    const initTelegram = async () => {
      // Проверяем наличие Telegram Web App API
      if (window.Telegram?.WebApp?.initDataUnsafe) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        
        // Full-screen mode: Telegram Web App API v6.0+
        // Expand to remove the top Telegram header
        if (typeof tg.expand === 'function') {
          tg.expand();
        }
        
        // Request full viewport for proper full-screen handling
        // This enables viewportChanged events and safe area insets
        if (typeof tg.requestViewport === 'function') {
          tg.requestViewport();
        }
        
        setWebApp(tg);
        
        // Initialize CSS custom properties for viewport and safe areas
        // These will be updated dynamically via viewportChanged event
        const updateViewportStyles = (event) => {
          const root = document.documentElement;
          
          // Set viewport height (use stable height for consistent layouts)
          const viewportHeight = event?.viewportStableHeight || event?.height || window.innerHeight;
          root.style.setProperty('--tg-viewport-height', `${viewportHeight}px`);
          
          // Set safe area insets (top/bottom) to avoid overlaps from status bar, notches, navigation gestures
          const safeAreaTop = event?.stableTopInset || event?.topInset || 0;
          const safeAreaBottom = event?.stableBottomInset || event?.bottomInset || 0;
          root.style.setProperty('--tg-safe-area-top', `${safeAreaTop}px`);
          root.style.setProperty('--tg-safe-area-bottom', `${safeAreaBottom}px`);
          
          // Handle unstable states during system UI transitions (e.g., when status bar appears/disappears)
          // Apply padding to body/main wrapper when state is unstable to prevent content jumps
          const isStateStable = event?.isStateStable !== false;
          const body = document.body;
          
          if (!isStateStable) {
            // During transitions, use current insets (may be changing)
            const currentTop = event?.topInset || 0;
            const currentBottom = event?.bottomInset || 0;
            body.style.paddingTop = `${currentTop}px`;
            body.style.paddingBottom = `${currentBottom}px`;
          } else {
            // Stable state: use stable insets and let CSS handle it
            body.style.paddingTop = `${safeAreaTop}px`;
            body.style.paddingBottom = `${safeAreaBottom}px`;
          }
        };
        
        // Initial viewport setup
        // Check if viewportChanged event is available (API v6.0+)
        if (typeof tg.onEvent === 'function') {
          // Listen to viewportChanged event for dynamic adjustments
          tg.onEvent('viewportChanged', (event) => {
            updateViewportStyles(event);
          });
          
          // Get initial viewport state if available
          if (tg.viewportHeight) {
            updateViewportStyles({
              height: tg.viewportHeight,
              viewportStableHeight: tg.viewportStableHeight || tg.viewportHeight,
              topInset: tg.safeAreaInsets?.top || 0,
              bottomInset: tg.safeAreaInsets?.bottom || 0,
              stableTopInset: tg.safeAreaInsets?.top || 0,
              stableBottomInset: tg.safeAreaInsets?.bottom || 0,
              isStateStable: true,
            });
          }
        } else {
          // Fallback for older APIs: check if expanded and use basic safe areas
          if (tg.isExpanded) {
            // Partially expand if full-screen isn't supported
            const root = document.documentElement;
            root.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
            root.style.setProperty('--tg-safe-area-top', '0px');
            root.style.setProperty('--tg-safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
          }
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
        root.style.setProperty('--tg-safe-area-top', '0px');
        root.style.setProperty('--tg-safe-area-bottom', '0px');
        
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

