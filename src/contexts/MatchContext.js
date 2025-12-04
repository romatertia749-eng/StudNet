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
  const updateConnectsCount = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.MATCHES}?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Количество взаимных мэтчей = длина массива мэтчей
        setConnectsCount(data.length);
        // Также обновляем matchedProfiles для синхронизации
        // Безопасная обработка interests и goals
        const formattedMatches = data.map(match => {
          let interestsArray = [];
          if (match.matchedProfile?.interests) {
            if (Array.isArray(match.matchedProfile.interests)) {
              interestsArray = match.matchedProfile.interests;
            } else if (typeof match.matchedProfile.interests === 'string') {
              try {
                interestsArray = JSON.parse(match.matchedProfile.interests);
              } catch (e) {
                interestsArray = [];
              }
            }
          }
          
          let goalsArray = [];
          if (match.matchedProfile?.goals) {
            if (Array.isArray(match.matchedProfile.goals)) {
              goalsArray = match.matchedProfile.goals;
            } else if (typeof match.matchedProfile.goals === 'string') {
              try {
                goalsArray = JSON.parse(match.matchedProfile.goals);
              } catch (e) {
                goalsArray = [];
              }
            }
          }
          
          return {
            id: match.matchedProfile?.id,
            userId: match.matchedProfile?.user_id || match.matchedProfile?.id,
            name: match.matchedProfile?.name || '',
            age: match.matchedProfile?.age || 0,
            city: match.matchedProfile?.city || '',
            university: match.matchedProfile?.university || '',
            bio: match.matchedProfile?.bio || '',
            interests: interestsArray,
            goals: goalsArray,
            photos: match.matchedProfile?.photo_url ? [match.matchedProfile.photo_url] : [],
            username: match.matchedProfile?.username || null,
          };
        });
        setMatchedProfiles(formattedMatches);
        // Убрано сохранение в localStorage - данные всегда свежие с API
      }
    } catch (error) {
      console.error('Error fetching connects count:', error);
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

