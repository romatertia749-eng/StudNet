import { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    // Загрузка из localStorage при инициализации
    const saved = localStorage.getItem('matchedProfiles');
    if (saved) {
      try {
        setMatchedProfiles(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading matches:', e);
      }
    }
  }, []);

  const addMatch = (profile) => {
    const updated = [...matchedProfiles, profile];
    setMatchedProfiles(updated);
    localStorage.setItem('matchedProfiles', JSON.stringify(updated));
  };

  const value = {
    matchedProfiles,
    addMatch,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};

