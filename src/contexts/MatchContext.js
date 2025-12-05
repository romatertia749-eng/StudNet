import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/api';

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

  // Убрана загрузка из localStorage - данные загружаются только с API
  // Очищаем старые данные из localStorage при инициализации
  useEffect(() => {
    localStorage.removeItem('matchedProfiles');
  }, []);

  // ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ: connectsCount обновляется только из API
  // НЕ обновляем connectsCount при изменении matchedProfiles, чтобы избежать циклов
  const updateConnectsCount = useCallback(async (userId) => {
    if (!userId || isLoadingCount) return; // Предотвращаем параллельные запросы
    
    setIsLoadingCount(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.MATCHES}?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const count = Array.isArray(data) ? data.length : 0;
        setConnectsCount(count);
      }
    } catch (error) {
      console.error('[MatchContext] Error fetching connects count:', error);
      // Fallback - не обновляем, оставляем текущее значение
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
    // connectsCount всегда равен длине profiles
    // Это синхронизирует состояние с реальными данными из NetworkList
    setConnectsCount(profiles.length);
  };

  const value = {
    matchedProfiles,
    connectsCount,
    addMatch,
    updateConnectsCount,
    setMatchedProfiles: setMatchedProfilesAndUpdateCount,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};

