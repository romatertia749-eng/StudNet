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

  useEffect(() => {
    // Загрузка из localStorage при инициализации
    const saved = localStorage.getItem('matchedProfiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMatchedProfiles(parsed);
        setConnectsCount(parsed.length);
      } catch (e) {
        console.error('Error loading matches:', e);
      }
    }
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
        const formattedMatches = data.map(match => ({
          id: match.matchedProfile.id,
          userId: match.matchedProfile.user_id || match.matchedProfile.id,
          name: match.matchedProfile.name,
          age: match.matchedProfile.age,
          city: match.matchedProfile.city,
          university: match.matchedProfile.university,
          bio: match.matchedProfile.bio,
          interests: match.matchedProfile.interests || [],
          photos: match.matchedProfile.photo_url ? [match.matchedProfile.photo_url] : [],
        }));
        setMatchedProfiles(formattedMatches);
        localStorage.setItem('matchedProfiles', JSON.stringify(formattedMatches));
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
    localStorage.setItem('matchedProfiles', JSON.stringify(updated));
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

