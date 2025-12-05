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

  // Убрана блокирующая проверка профиля - загрузка происходит сразу

  useEffect(() => {
    // Загружаем мэтчи сразу, не ждем проверку профиля
    if (!isReady || !userInfo?.id) {
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      setLoading(true);
      
      try {
        // Используем AbortController для таймаута
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
        
        const url = `${API_ENDPOINTS.MATCHES}?user_id=${userInfo.id}`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          
          if (!Array.isArray(data)) {
            setMatchedProfiles([]);
            setLoading(false);
            return;
          }
          
          // Преобразуем данные из API в формат для отображения
          const formattedMatches = data.map((match) => {
            // Проверяем разные варианты структуры данных
            const profile = match.matchedProfile || match.matched_profile || match.profile;
            
            if (!profile) {
              return null;
            }
            
            // Безопасная обработка interests
            let interestsArray = [];
            if (profile?.interests) {
              if (Array.isArray(profile.interests)) {
                interestsArray = profile.interests;
              } else if (typeof profile.interests === 'string') {
                try {
                  interestsArray = JSON.parse(profile.interests);
                } catch (e) {
                  interestsArray = [];
                }
              }
            }
            
            // Безопасная обработка goals
            let goalsArray = [];
            if (profile?.goals) {
              if (Array.isArray(profile.goals)) {
                goalsArray = profile.goals;
              } else if (typeof profile.goals === 'string') {
                try {
                  goalsArray = JSON.parse(profile.goals);
                } catch (e) {
                  goalsArray = [];
                }
              }
            }
            
            const formatted = {
              id: profile?.id,
              userId: profile?.user_id || profile?.id,
              name: profile?.name || '',
              age: profile?.age || 0,
              city: profile?.city || '',
              university: profile?.university || '',
              bio: profile?.bio || '',
              interests: interestsArray,
              goals: goalsArray,
              photos: profile?.photo_url ? [getPhotoUrl(profile.photo_url)] : [],
              username: profile?.username || null,
            };
            
            return formatted;
          }).filter(match => match !== null);
          
          setMatchedProfiles(formattedMatches);
          // Обновляем контекст с мэтчами - это единственный источник данных
          if (formattedMatches.length > 0) {
            setContextMatchedProfiles(formattedMatches);
          }
        } else {
          // Бэкенд недоступен — показываем пустой список локально
          setMatchedProfiles([]);
        }
      } catch (error) {
        // При ошибке показываем пустой список локально
        if (error.name !== 'AbortError') {
          console.error('[NetworkList] Error fetching matches:', error);
        }
        setMatchedProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [userInfo, isReady, setContextMatchedProfiles]);

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

  if (loading) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <div className="space-y-4 mt-4">
          <Card>
            <p className="text-gray-800 text-center py-8 font-medium">
              Загрузка мэтчей...
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

