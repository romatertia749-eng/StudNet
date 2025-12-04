import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { useMatches } from '../contexts/MatchContext';
import { useWebApp } from '../contexts/WebAppContext';
import { API_ENDPOINTS, getPhotoUrl } from '../config/api';

// Мемоизированная карточка профиля для предотвращения лишних ре-рендеров при скролле
const MatchCard = memo(({ person, onViewProfile, onMessage }) => (
  <div 
    className="p-4 rounded-2xl bg-white/20 border border-white/30"
    style={{ contain: 'layout style paint' }}
  >
    <div className="flex items-start gap-3 mb-3">
      {person.photos && person.photos.length > 0 && person.photos[0] ? (
        <img
          src={person.photos[0]}
          alt={person.name}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 border border-white/40">
          <span className="text-2xl">👤</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 mb-1">{person.name}, {person.age}</h3>
        <p className="text-xs text-gray-500 mb-2">{person.city} • {person.university}</p>
        <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{person.bio}</p>
        {person.interests && person.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {person.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-white/20 text-teal-700 rounded text-xs border border-white/40"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        onClick={() => onViewProfile(person.id)}
        className="w-full text-sm py-2 min-h-[40px]"
      >
        Посмотреть профиль
      </Button>
      {person.username ? (
        <Button
          variant="primary"
          onClick={() => onMessage(person.username)}
          className="w-full text-sm py-2 min-h-[40px]"
        >
          💬 Написать
        </Button>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">
          Username не указан
        </p>
      )}
    </div>
  </div>
));

MatchCard.displayName = 'MatchCard';

const NetworkList = () => {
  const navigate = useNavigate();
  const { setMatchedProfiles: setContextMatchedProfiles, updateConnectsCount } = useMatches();
  const { userInfo, isReady } = useWebApp();
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Проверка наличия профиля пользователя
  useEffect(() => {
    if (!isReady || !userInfo?.id) {
      return;
    }

    const checkUserProfile = async () => {
      setCheckingProfile(true);
      try {
        // Проверяем наличие профиля через специальный эндпоинт
        const url = API_ENDPOINTS.CHECK_PROFILE(userInfo.id);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (!data.exists) {
            // Профиля нет, перенаправляем на создание
            alert('Сначала создайте свой профиль, чтобы начать искать знакомства');
            navigate('/profile/edit');
            return;
          }
        } else if (response.status === 404) {
          // Профиля нет - это нормально, перенаправляем на создание
          alert('Сначала создайте свой профиль, чтобы начать искать знакомства');
          navigate('/profile/edit');
          return;
        } else {
          // При другой ошибке не блокируем, возможно бэкенд недоступен
          if (process.env.NODE_ENV === 'development') {
            console.warn('Could not check profile, continuing anyway');
          }
        }
      } catch (error) {
        // При ошибке сети не блокируем, возможно бэкенд недоступен
        // Логируем только в режиме разработки
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking profile:', error);
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [isReady, userInfo, navigate]);

  useEffect(() => {
    // Не загружаем мэтчи, пока проверяем профиль
    if (checkingProfile) {
      return;
    }

    const fetchMatches = async () => {
      if (!userInfo?.id) {
        setMatchedProfiles([]);
        setContextMatchedProfiles([]); // Обновляем контекст
        setLoading(false);
        return;
      }
      
      try {
        const url = `${API_ENDPOINTS.MATCHES}?user_id=${userInfo.id}`;
        console.log('[NetworkList] Fetching matches from:', url);
        console.log('[NetworkList] userInfo.id:', userInfo.id);
        const response = await fetch(url);
        console.log('[NetworkList] Matches response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[NetworkList] Raw matches data received:', JSON.stringify(data, null, 2));
          console.log('[NetworkList] Matches count:', data.length);
          console.log('[NetworkList] Data type:', typeof data, Array.isArray(data));
          
          // Проверяем структуру данных
          if (data.length > 0) {
            console.log('[NetworkList] First match structure:', Object.keys(data[0]));
            console.log('[NetworkList] First match matchedProfile:', data[0].matchedProfile ? Object.keys(data[0].matchedProfile) : 'null');
          }
          
          if (!Array.isArray(data)) {
            console.error('[NetworkList] ERROR: Data is not an array!', data);
            setMatchedProfiles([]);
            setLoading(false);
            return;
          }
          
          // Преобразуем данные из API в формат для отображения
          const formattedMatches = data.map((match, index) => {
            console.log(`[NetworkList] Processing match ${index}:`, match);
            console.log(`[NetworkList] Match keys:`, Object.keys(match));
            console.log(`[NetworkList] Match has matchedProfile:`, 'matchedProfile' in match);
            console.log(`[NetworkList] Match matchedProfile value:`, match.matchedProfile);
            
            if (!match.matchedProfile) {
              console.error(`[NetworkList] ERROR: match ${index} has no matchedProfile!`, match);
              console.error(`[NetworkList] Full match object:`, JSON.stringify(match, null, 2));
              return null;
            }
            
            console.log(`[NetworkList] Match ${index} matchedProfile keys:`, Object.keys(match.matchedProfile));
            
            // Безопасная обработка interests
            let interestsArray = [];
            if (match.matchedProfile?.interests) {
              if (Array.isArray(match.matchedProfile.interests)) {
                interestsArray = match.matchedProfile.interests;
              } else if (typeof match.matchedProfile.interests === 'string') {
                try {
                  interestsArray = JSON.parse(match.matchedProfile.interests);
                } catch (e) {
                  console.warn(`[NetworkList] Failed to parse interests for match ${index}:`, e);
                  interestsArray = [];
                }
              }
            }
            
            // Безопасная обработка goals
            let goalsArray = [];
            if (match.matchedProfile?.goals) {
              if (Array.isArray(match.matchedProfile.goals)) {
                goalsArray = match.matchedProfile.goals;
              } else if (typeof match.matchedProfile.goals === 'string') {
                try {
                  goalsArray = JSON.parse(match.matchedProfile.goals);
                } catch (e) {
                  console.warn(`[NetworkList] Failed to parse goals for match ${index}:`, e);
                  goalsArray = [];
                }
              }
            }
            
            const formatted = {
              id: match.matchedProfile?.id,
              userId: match.matchedProfile?.user_id || match.matchedProfile?.id,
              name: match.matchedProfile?.name || '',
              age: match.matchedProfile?.age || 0,
              city: match.matchedProfile?.city || '',
              university: match.matchedProfile?.university || '',
              bio: match.matchedProfile?.bio || '',
              interests: interestsArray,
              goals: goalsArray,
              photos: match.matchedProfile?.photo_url ? [getPhotoUrl(match.matchedProfile.photo_url)] : [],
              username: match.matchedProfile?.username || null,
            };
            
            console.log(`[NetworkList] Formatted match ${index}:`, formatted);
            return formatted;
          }).filter(match => match !== null); // Убираем null значения
          
          console.log('[NetworkList] Final formatted matches:', formattedMatches);
          console.log('[NetworkList] Formatted matches count:', formattedMatches.length);
          
          if (formattedMatches.length === 0 && data.length > 0) {
            console.error('[NetworkList] WARNING: Data received but formatted matches is empty!');
            console.error('[NetworkList] This means matchedProfile is missing or null in response');
          }
          
          setMatchedProfiles(formattedMatches);
          // Обновляем контекст с мэтчами - это единственный источник данных
          setContextMatchedProfiles(formattedMatches);
          // connectsCount обновится автоматически в setMatchedProfilesAndUpdateCount
          // НЕ вызываем updateConnectsCount здесь, чтобы избежать циклов
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Matches response error:', response.status, errorText);
          // Бэкенд недоступен — показываем пустой список
          setMatchedProfiles([]);
          setContextMatchedProfiles([]); // Обновляем контекст, чтобы connectsCount стал 0
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
        // При ошибке показываем пустой список
        setMatchedProfiles([]);
        setContextMatchedProfiles([]); // Обновляем контекст, чтобы connectsCount стал 0
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [userInfo, checkingProfile, setContextMatchedProfiles]);

  // Мемоизированные обработчики для предотвращения пересоздания при каждом рендере
  const handleViewProfile = useCallback((id) => {
    navigate(`/profiles/${id}`);
  }, [navigate]);

  const handleMessage = useCallback((username) => {
    const cleanUsername = username.replace('@', '').trim();
    if (cleanUsername) {
      window.open(`https://t.me/${cleanUsername}`, '_blank');
    } else {
      alert('Username не указан');
    }
  }, []);

  // Мемоизированный список карточек
  const renderedCards = useMemo(() => 
    matchedProfiles.map((person) => (
      <MatchCard 
        key={person.id} 
        person={person} 
        onViewProfile={handleViewProfile}
        onMessage={handleMessage}
      />
    )), 
    [matchedProfiles, handleViewProfile, handleMessage]
  );

  if (checkingProfile || loading) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <div className="space-y-4 mt-4">
          <Card>
            <p className="text-gray-800 text-center py-8 font-medium">
              {checkingProfile ? 'Проверка профиля...' : 'Загрузка мэтчей...'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-4 mt-4">
        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Net-Лист</h2>
          {matchedProfiles.length === 0 ? (
            <p className="text-gray-800 text-center py-8 font-medium">
              У вас пока нет контактов.
              <br />
              Начните знакомиться!
            </p>
          ) : (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              style={{ contain: 'layout style' }}
            >
              {renderedCards}
            </div>
          )}
        </Card>

        <Button variant="outline" onClick={() => navigate('/profiles')}>
          Найти новых знакомых
        </Button>
      </div>
    </div>
  );
};

export default NetworkList;

