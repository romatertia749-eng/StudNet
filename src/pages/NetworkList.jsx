import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
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
  const { setMatchedProfiles: setContextMatchedProfiles } = useMatches();
  const { userInfo, isReady } = useWebApp();
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Убрана блокирующая проверка профиля - загрузка происходит сразу

  // Используем useRef для отслеживания, загружались ли уже данные
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef(null);
  const activeRequestsRef = useRef(0);
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:mount',message:'NetworkList component mounted',data:{hasLoaded:hasLoadedRef.current,userId:userInfo?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    return () => {
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:unmount',message:'NetworkList component unmounting',data:{matchedProfilesCount:matchedProfiles.length,activeRequests:activeRequestsRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    };
  }, []);
  // #endregion

  useEffect(() => {
    // Загружаем мэтчи сразу, не ждем проверку профиля
    if (!isReady || !userInfo?.id) {
      setLoading(false);
      return;
    }

    // Проверяем, нужно ли загружать данные
    const userId = userInfo.id;
    if (hasLoadedRef.current && lastUserIdRef.current === userId) {
      // Данные уже загружены для этого пользователя
      return;
    }

    let isMounted = true;
    let controller = null;

    const fetchMatches = async () => {
      // #region agent log
      activeRequestsRef.current += 1;
      const requestId = activeRequestsRef.current;
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:requestStart',message:'New fetch request started',data:{requestId,activeRequests:activeRequestsRef.current,userId,hasLoaded:hasLoadedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      if (!isMounted) {
        // #region agent log
        activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:requestCancelled',message:'Request cancelled - not mounted',data:{requestId,activeRequests:activeRequestsRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        return;
      }
      setLoading(true);
      
      // #region agent log
      const fetchStartTime = Date.now();
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:start',message:'Starting matches fetch',data:{requestId,userId,hasLoaded:hasLoadedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      try {
        controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const url = `${API_ENDPOINTS.MATCHES}?user_id=${userId}`;
        const response = await fetch(url, {
          signal: controller.signal
        });
        
        // #region agent log
        const fetchEndTime = Date.now();
        const fetchDuration = fetchEndTime - fetchStartTime;
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:response',message:'Matches fetch response received',data:{status:response.status,ok:response.ok,durationMs:fetchDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        if (response.ok) {
          const data = await response.json();
          
          if (!Array.isArray(data)) {
            setMatchedProfiles([]);
            setLoading(false);
            hasLoadedRef.current = true;
            lastUserIdRef.current = userId;
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
          
          if (isMounted) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:setMatches',message:'Setting matchedProfiles state',data:{newCount:formattedMatches.length,oldCount:matchedProfiles.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            setMatchedProfiles(formattedMatches);
            // Обновляем контекст с мэтчами - это единственный источник данных
            if (formattedMatches.length > 0) {
              setContextMatchedProfiles(formattedMatches);
            }
            hasLoadedRef.current = true;
            lastUserIdRef.current = userId;
          }
        } else {
          if (isMounted) {
            setMatchedProfiles([]);
            hasLoadedRef.current = true;
            lastUserIdRef.current = userId;
          }
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:error',message:'Fetch error caught',data:{errorName:error.name,errorMessage:error.message,isAbortError:error.name==='AbortError',isMounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        if (!isMounted) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:error:unmounted',message:'Error after unmount - request not cancelled',data:{errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          return;
        }
        if (error.name === 'AbortError') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:abortError',message:'AbortError - request was cancelled or timed out',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          console.warn('[NetworkList] Request timeout');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error('[NetworkList] Network error - backend not reachable:', error);
          alert('Не удалось подключиться к серверу. Проверьте, что бэкенд запущен и доступен по адресу: ' + API_ENDPOINTS.MATCHES);
        } else {
          console.error('[NetworkList] Error fetching matches:', error);
        }
        setMatchedProfiles([]);
        hasLoadedRef.current = true;
        lastUserIdRef.current = userId;
      } finally {
        // #region agent log
        activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:requestComplete',message:'Fetch request completed',data:{requestId,activeRequests:activeRequestsRef.current,isMounted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchMatches();
    
    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:cleanup',message:'Cleaning up fetchMatches',data:{hasController:!!controller,isLoading:loading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      isMounted = false;
      if (controller) {
        controller.abort();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NetworkList.jsx:fetchMatches:abort',message:'AbortController.abort() called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      }
    };
  }, [isReady, userInfo?.id, setContextMatchedProfiles]);

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

