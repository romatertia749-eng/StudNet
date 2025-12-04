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

  // Обновляем connectsCount при изменении matchedProfiles
  useEffect(() => {
    // connectsCount равен количеству взаимных мэтчей (matchedProfiles)
    // В matchedProfiles уже хранятся только взаимные мэтчи
    setConnectsCount(matchedProfiles.length);
  }, [matchedProfiles]);

  // Убрана загрузка из localStorage - данные загружаются только с API
  // Очищаем старые данные из localStorage при инициализации
  useEffect(() => {
    localStorage.removeItem('matchedProfiles');
  }, []);

  // Функция для обновления connectsCount из API
  // ВАЖНО: Эта функция НЕ должна обновлять matchedProfiles, чтобы избежать конфликтов
  // matchedProfiles обновляются только в NetworkList.jsx
  const updateConnectsCount = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      console.log('[MatchContext] updateConnectsCount called for userId:', userId);
      const response = await fetch(`${API_ENDPOINTS.MATCHES}?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[MatchContext] Matches count from API:', data.length);
        // Количество взаимных мэтчей = длина массива мэтчей
        setConnectsCount(data.length);
        // НЕ обновляем matchedProfiles здесь - это делает NetworkList.jsx
      } else {
        console.error('[MatchContext] Failed to fetch matches count:', response.status);
      }
    } catch (error) {
      console.error('[MatchContext] Error fetching connects count:', error);
      // Fallback - не обновляем, оставляем текущее значение
    }
  }, []);

  const addMatch = (profile) => {
    const updated = [...matchedProfiles, profile];
    setMatchedProfiles(updated);
    setConnectsCount(updated.length);
    // Убрано сохранение в localStorage - данные всегда свежие с API
  };

  const setMatchedProfilesAndUpdateCount = (profiles) => {
    setMatchedProfiles(profiles);
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

