import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import OnboardingMainGoal from '../components/OnboardingMainGoal';
import WelcomeCreateProfileScreen from '../components/WelcomeCreateProfileScreen';

const ExistingHomeContent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6 flex flex-col justify-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-8 md:space-y-12">
        <Card className="bg-white/30 backdrop-blur-xl border-2 border-white/50 shadow-2xl transform transition-all hover:scale-[1.02] hover:shadow-3xl">
          <div className="relative p-4 md:p-5">
            <div className="absolute -top-3 -left-3 w-24 h-24 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl -z-10"></div>
            <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl -z-10"></div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center leading-tight relative z-10" style={{ fontFamily: "'La Bamba', cursive" }}>
              Всего одно знакомство отделяет тебя от большой перемены в жизни
            </h1>
          </div>
        </Card>

        <div className="space-y-6 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
          <Button
            variant="primary"
            onClick={() => navigate('/profile/edit')}
            className="transform transition-all hover:scale-105 hover:shadow-xl"
          >
            Профиль
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/profiles')}
            className="transform transition-all hover:scale-105 hover:shadow-xl"
          >
            Анкеты
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/network')}
            className="transform transition-all hover:scale-105 hover:shadow-xl relative"
          >
            {/* Декоративная иконка сети из людей в правом верхнем углу */}
            <img
              src="/assets/stuff/сеть_из_людей_для_кнопки.png"
              alt="Сеть связей"
              className="absolute top-2 right-2 w-6 h-6 pointer-events-none z-10 opacity-80"
              style={{
                maxWidth: '28px',
                maxHeight: '28px',
              }}
            />
            Net-Лист
          </Button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { hasCompletedProfile, hasCompletedOnboarding, mainGoal, userInfo, isReady } = useWebApp();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileExists, setProfileExists] = useState(null);
  const [showLoaderTimeout, setShowLoaderTimeout] = useState(true);
  
  // Кэш для проверки профиля
  const profileCheckCacheRef = useRef(null);
  const profileCheckTimestampRef = useRef(0);
  const PROFILE_CHECK_CACHE_DURATION = 2 * 60 * 1000; // 2 минуты

  // Таймаут для показа контента после 3 секунд ожидания
  useEffect(() => {
    if (checkingProfile) {
      const timer = setTimeout(() => {
        setShowLoaderTimeout(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowLoaderTimeout(true);
    }
  }, [checkingProfile]);

  // Проверяем профиль на сервере при загрузке
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (isMounted) {
        setCheckingProfile(false);
      }
    };

    if (!isReady || !userInfo?.id) {
      // Если не готово, используем значение из контекста
      if (isMounted) {
        setProfileExists(hasCompletedProfile);
        setCheckingProfile(false);
      }
      return cleanup;
    }
    
    // Проверяем кэш
    const now = Date.now();
    if (profileCheckCacheRef.current !== null && (now - profileCheckTimestampRef.current) < PROFILE_CHECK_CACHE_DURATION) {
      if (isMounted) {
        setProfileExists(profileCheckCacheRef.current);
        setCheckingProfile(false);
      }
      return cleanup;
    }

    // Таймаут для всей проверки - максимум 5 секунд
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Home] Profile check timeout, using fallback');
        const fallback = hasCompletedProfile;
        setProfileExists(fallback);
        profileCheckCacheRef.current = fallback;
        profileCheckTimestampRef.current = Date.now();
        setCheckingProfile(false);
      }
    }, 5000);

    const checkProfile = async () => {
      try {
        const { fetchWithRetry } = await import('../utils/api');
        const { API_ENDPOINTS } = await import('../config/api');
        
        const response = await fetchWithRetry(
          API_ENDPOINTS.CHECK_PROFILE(userInfo.id),
          { retry: false }, // Отключаем retry, чтобы не ждать долго
          1, // Только 1 попытка
          4000, // 4 секунды таймаут
          3000  // 3 секунды для retry (не используется)
        );
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          const exists = data.exists;
          setProfileExists(exists);
          // Обновляем кэш
          profileCheckCacheRef.current = exists;
          profileCheckTimestampRef.current = Date.now();
        } else {
          // При ошибке считаем, что профиля нет
          setProfileExists(false);
          profileCheckCacheRef.current = false;
          profileCheckTimestampRef.current = Date.now();
        }
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!isMounted) return;
        
        console.error('[Home] Error checking profile:', error);
        // При ошибке используем значение из контекста
        const fallback = hasCompletedProfile;
        setProfileExists(fallback);
        profileCheckCacheRef.current = fallback;
        profileCheckTimestampRef.current = Date.now();
      } finally {
        if (isMounted) {
          setCheckingProfile(false);
        }
      }
    };

    checkProfile();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isReady, userInfo?.id, hasCompletedProfile]);

  // Если не готово, показываем загрузку
  if (!isReady) {
    return <Loader message="Загрузка..." />;
  }

  // Пока проверяем профиль, но не более 3 секунд - показываем загрузку
  // После 3 секунд показываем контент на основе контекста
  if (checkingProfile && showLoaderTimeout) {
    return <Loader message="Проверка профиля..." />;
  }
  
  // Если проверка затянулась (больше 3 секунд), используем значение из контекста
  if (checkingProfile && !showLoaderTimeout) {
    const shouldShowWelcome = !hasCompletedProfile;
    if (shouldShowWelcome) {
      return <WelcomeCreateProfileScreen />;
    }
    return <OnboardingMainGoal />;
  }

  // Используем реальное состояние с сервера, если доступно, иначе из контекста
  const shouldShowWelcome = profileExists !== null ? !profileExists : !hasCompletedProfile;

  // Если профиль не создан, показываем экран приветствия
  if (shouldShowWelcome) {
    return <WelcomeCreateProfileScreen />;
  }

  // Если профиль создан, показываем онбординг (онбординг стал home страницей)
  return <OnboardingMainGoal />;
};

export default Home;

