import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { fetchWithAuth } from '../utils/api';

const MatchContext = createContext(null);

export const useMatches = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within MatchProvider');
  }
  return context;
};

export const MatchProvider = ({ children }) => {
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [connectsCount, setConnectsCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  
  // Кэш для загруженных данных - предотвращает повторную загрузку
  const profilesCacheRef = useRef(null);
  const cacheTimestampRef = useRef(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  // Убрана загрузка из localStorage - данные загружаются только с API
  // Очищаем старые данные из localStorage при инициализации
  useEffect(() => {
    localStorage.removeItem('matchedProfiles');
  }, []);

  // ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ: connectsCount обновляется только из API
  // НЕ обновляем connectsCount при изменении matchedProfiles, чтобы избежать циклов
  const updateConnectsCount = useCallback(async (userId) => {
    if (!userId || isLoadingCount) return;
    
    setIsLoadingCount(true);
    try {
      const response = await fetchWithAuth(`${API_ENDPOINTS.MATCHES}?user_id=${userId}`, { retry: false });
      
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 0;
        setConnectsCount(count);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('[MatchContext] Error fetching connects count:', error);
      }
    } finally {
      setIsLoadingCount(false);
    }
  }, [isLoadingCount]);

  const addMatch = (profile) => {
    const updated = [...matchedProfiles, profile];
    setMatchedProfiles(updated);
    // НЕ обновляем connectsCount здесь - он обновится через updateConnectsCount
  };

  const setMatchedProfilesAndUpdateCount = (profiles) => {
    setMatchedProfiles(profiles);
    // Обновляем кэш
    profilesCacheRef.current = profiles;
    cacheTimestampRef.current = Date.now();
    // connectsCount всегда равен длине profiles
    // Это синхронизирует состояние с реальными данными из NetworkList
    setConnectsCount(profiles.length);
  };

  // Функция для получения кэшированных данных
  const getCachedProfiles = useCallback(() => {
    const now = Date.now();
    if (profilesCacheRef.current && (now - cacheTimestampRef.current) < CACHE_DURATION) {
      return profilesCacheRef.current;
    }
    return null;
  }, []);

  // Функция для проверки, нужно ли загружать данные
  const shouldFetchProfiles = useCallback(() => {
    const now = Date.now();
    return !profilesCacheRef.current || (now - cacheTimestampRef.current) >= CACHE_DURATION;
  }, []);

  const value = {
    matchedProfiles,
    connectsCount,
    addMatch,
    updateConnectsCount,
    setMatchedProfiles: setMatchedProfilesAndUpdateCount,
    getCachedProfiles,
    shouldFetchProfiles,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};

