import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Autocomplete from '../components/Autocomplete';
import EffectOverlay from '../components/EffectOverlay';
import { russianCities, universities, interests } from '../data/formData';
import { useMatches } from '../contexts/MatchContext';
import { useWebApp } from '../contexts/WebAppContext';
import { API_ENDPOINTS, getPhotoUrl } from '../config/api';
import { fetchWithAuth } from '../utils/api';

const Profiles = () => {
  const navigate = useNavigate();
  const { addMatch } = useMatches();
  const { userInfo, isReady } = useWebApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedProfiles, setSwipedProfiles] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  // Убрана блокирующая проверка профиля
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  
  // Состояние для вкладок
  const [activeTab, setActiveTab] = useState('all');
  const [incomingLikes, setIncomingLikes] = useState([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [incomingError, setIncomingError] = useState(null);
  const [showIncomingTip, setShowIncomingTip] = useState(false);
  
  /**
   * АРХИТЕКТУРА УПРАВЛЕНИЯ ЭФФЕКТАМИ:
   * 
   * isEffectActive - флаг активности эффекта, блокирует свайп и кнопки
   * effectDirection - направление эффекта ("left" | "right")
   * pendingIndexChange - отложенное изменение индекса карточки
   * 
   * СИНХРОНИЗАЦИЯ:
   * 1. При свайпе устанавливаем isEffectActive=true и effectDirection
   * 2. EffectOverlay проигрывает анимацию и вызывает onComplete через таймаут
   * 3. handleEffectComplete разблокирует свайп и применяет pendingIndexChange
   * 4. Новая карточка появляется с плавной анимацией через Framer Motion
   */
  const [isEffectActive, setIsEffectActive] = useState(false);
  const [effectDirection, setEffectDirection] = useState(null);
  const [pendingIndexChange, setPendingIndexChange] = useState(null);
  // Направление последнего свайпа для правильной exit-анимации
  const [lastSwipeDirection, setLastSwipeDirection] = useState(null);
  const cardRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  // Защита от повторных вызовов handleLike/handlePass
  const isProcessingSwipe = useRef(false);
  // Оптимизация: RAF для плавности touch-событий (предотвращает блокировку скролла)
  const rafId = useRef(null);

  // Моковые данные для fallback
  const getMockProfiles = () => [
    {
      id: 1,
      name: 'Алексей',
      age: 22,
      city: 'Москва',
      university: 'МГУ им. М.В. Ломоносова',
      interests: ['IT', 'Программирование', 'Стартапы'],
      goals: ['Совместная учёба', 'Найти команду для хакатона'],
      bio: 'Студент, увлекаюсь разработкой и созданием стартапов. Ищу единомышленников для совместных проектов.',
      photos: [],
    },
    {
      id: 2,
      name: 'Мария',
      age: 21,
      city: 'Санкт-Петербург',
      university: 'СПбГУ',
      interests: ['Дизайн', 'Фотография', 'Искусство'],
      goals: ['Совместные активности', 'Друзья по интересам'],
      bio: 'Дизайнер, увлекаюсь фотографией и искусством. Люблю креативные проекты и общение с интересными людьми.',
      photos: [],
    },
    {
      id: 3,
      name: 'Дмитрий',
      age: 23,
      city: 'Москва',
      university: 'МГТУ им. Н.Э. Баумана',
      interests: ['Стартапы', 'IT', 'Предпринимательство'],
      goals: ['Стартап', 'Стажировки/работа'],
      bio: 'Предприниматель, ищу команду для стартапа в сфере IT. Опыт в разработке и бизнесе.',
      photos: [],
    },
    {
      id: 4,
      name: 'Анна',
      age: 20,
      city: 'Казань',
      university: 'КФУ',
      interests: ['Волонтёрство', 'Спорт', 'Музыка'],
      goals: ['Друзья по интересам', 'Совместные активности'],
      bio: 'Активная студентка, занимаюсь волонтёрством и спортом. Ищу единомышленников для интересных проектов.',
      photos: [],
    },
    {
      id: 5,
      name: 'Елена',
      age: 24,
      city: 'Новосибирск',
      university: 'НГУ',
      interests: ['Наука', 'Исследования', 'Образование'],
      goals: ['Совместная учёба', 'Расширение круга'],
      bio: 'Аспирантка, занимаюсь научными исследованиями. Интересуюсь новыми технологиями и обменом знаниями.',
      photos: [],
    },
    {
      id: 6,
      name: 'Иван',
      age: 19,
      city: 'Екатеринбург',
      university: 'УрФУ',
      interests: ['Спорт', 'Тренажёрный зал', 'Бег'],
      goals: ['Друзья по интересам', 'Совместные активности'],
      bio: 'Активный спортсмен, занимаюсь в зале и бегаю. Ищу компанию для совместных тренировок и активного отдыха.',
      photos: [],
    },
    {
      id: 7,
      name: 'София',
      age: 22,
      city: 'Москва',
      university: 'НИУ ВШЭ',
      interests: ['Финансы', 'Инвестиции', 'Предпринимательство'],
      goals: ['Стажировки/работа', 'Стартап'],
      bio: 'Студентка экономического факультета. Интересуюсь финансами и инвестициями, ищу единомышленников для бизнес-проектов.',
      photos: [],
    },
    {
      id: 8,
      name: 'Максим',
      age: 25,
      city: 'Санкт-Петербург',
      university: 'СПбПУ Петра Великого',
      interests: ['Программирование', 'IT', 'Видеоигры'],
      goals: ['Найти команду для хакатона', 'Стажировки/работа'],
      bio: 'Разработчик, увлекаюсь созданием игр и мобильных приложений. Ищу команду для участия в хакатонах.',
      photos: [],
    },
  ];

  // Убрана блокирующая проверка профиля - загрузка происходит сразу

  // Проверка, нужно ли показать модалку с объяснением свайпов
  useEffect(() => {
    if (!isReady) return;
    
    const hasSeenTutorial = localStorage.getItem('maxnet_swipe_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowSwipeTutorial(true);
    }
  }, [isReady]);

  // Скрываем шапку и нижнее меню когда открыта модалка
  useEffect(() => {
    if (showSwipeTutorial) {
      document.body.style.overflow = 'hidden';
      // Добавляем класс для скрытия шапки и меню
      const header = document.querySelector('header');
      const bottomNav = document.querySelector('nav');
      if (header) header.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      document.body.style.overflow = '';
      const header = document.querySelector('header');
      const bottomNav = document.querySelector('nav');
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      const header = document.querySelector('header');
      const bottomNav = document.querySelector('nav');
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
    };
  }, [showSwipeTutorial]);

  // Загрузка входящих лайков при переключении на вкладку
  const fetchIncomingLikes = async () => {
    if (!userInfo?.id) return;
    
    setLoadingIncoming(true);
    setIncomingError(null);
    setIncomingLikes([]);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const url = `${API_ENDPOINTS.INCOMING_LIKES}?user_id=${userInfo.id}`;
      console.log('Fetching incoming likes from:', url);
      const response = await fetchWithAuth(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Incoming likes response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Incoming likes data:', data);
        const profiles = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
        
        const processedProfiles = profiles.map(profile => {
          let interestsArray = [];
          if (profile.interests) {
            if (Array.isArray(profile.interests)) {
              interestsArray = profile.interests;
            } else if (typeof profile.interests === 'string') {
              try { interestsArray = JSON.parse(profile.interests); } catch (e) { interestsArray = []; }
            }
          }
          
          let goalsArray = [];
          if (profile.goals) {
            if (Array.isArray(profile.goals)) {
              goalsArray = profile.goals;
            } else if (typeof profile.goals === 'string') {
              try { goalsArray = JSON.parse(profile.goals); } catch (e) { goalsArray = []; }
            }
          }
          
          return {
            ...profile,
            interests: interestsArray,
            goals: goalsArray,
            photos: profile.photo_url ? [getPhotoUrl(profile.photo_url)] : []
          };
        });
        
        // Устанавливаем данные и сбрасываем индекс только после загрузки
        setIncomingLikes(processedProfiles);
        setCurrentIndex(0); // Сбрасываем индекс только когда данные загружены
        
        // Показываем подсказку только первый раз
        const hasSeenIncomingTip = localStorage.getItem('maxnet_incoming_tip_seen');
        if (!hasSeenIncomingTip && processedProfiles.length > 0) {
          setShowIncomingTip(true);
        }
      } else if (response.status === 404) {
        // 404 — эндпоинт не реализован, показываем пустой список
        console.warn('Incoming likes endpoint not implemented yet');
        setIncomingLikes([]);
        setIncomingError('not_implemented');
        setCurrentIndex(0);
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Incoming likes error:', response.status, errorText);
        setIncomingError('load_error');
        setIncomingLikes([]);
        setCurrentIndex(0);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Incoming likes request timeout');
        setIncomingError('timeout');
      } else {
        console.error('Error fetching incoming likes:', error);
        setIncomingError('network_error');
      }
      setIncomingLikes([]);
      setCurrentIndex(0);
    } finally {
      setLoadingIncoming(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'incoming' && isReady && userInfo?.id) {
      // Очищаем свайпы и старые данные, индекс сбросится в fetchIncomingLikes после загрузки
      setSwipedProfiles([]);
      setIncomingLikes([]); // Очищаем старые данные сразу, чтобы не показывать их
      fetchIncomingLikes();
    }
  }, [activeTab, isReady, userInfo?.id]);

  // Загрузка профилей с бэкенда
  useEffect(() => {
    // Не загружаем профили, пока WebApp не готов или нет user_id
    if (!isReady || !userInfo?.id) {
      setLoading(false);
      return;
    }
    
    // Не загружаем, если активна вкладка "Входящие лайки"
    if (activeTab === 'incoming') {
      return;
    }
    
    let isMounted = true;
    let controller = null;
    
    const fetchProfiles = async () => {
      if (!isMounted) return;
      setLoading(true);
      
      try {
        controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        // УПРОЩЕННЫЙ ЗАПРОС БЕЗ ФИЛЬТРОВ
        const url = `${API_ENDPOINTS.PROFILES}?user_id=${userInfo.id}&page=0&size=50`;
        console.log('[Profiles] Fetching profiles from:', url);
        console.log('[Profiles] userInfo.id:', userInfo.id);
        
        const response = await fetchWithAuth(url, {
          signal: controller.signal
        });
        
        console.log('[Profiles] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        clearTimeout(timeoutId);
        
        console.log('[Profiles] Response status:', response.status);
        
        if (!isMounted) {
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          let data;
          try {
            data = await response.json();
            console.log('[Profiles] Received data:', data);
            console.log('[Profiles] Data type:', typeof data);
            console.log('[Profiles] Data.content type:', Array.isArray(data.content) ? 'array' : typeof data.content);
            console.log('[Profiles] Data.content length:', Array.isArray(data.content) ? data.content.length : 'not array');
          } catch (parseError) {
            console.error('[Profiles] Failed to parse JSON:', parseError);
            if (!isMounted) return;
            setAllProfiles([]);
            setLoading(false);
            return;
          }
          
          if (!isMounted) return;
          
          // УПРОЩЕННАЯ ОБРАБОТКА - принимаем любой формат
          let profiles = [];
          if (Array.isArray(data)) {
            profiles = data;
          } else if (Array.isArray(data.content)) {
            profiles = data.content;
          } else if (data.content && typeof data.content === 'object') {
            profiles = [data.content];
          }
          
          console.log('[Profiles] Processed profiles count:', profiles.length);
          console.log('[Profiles] Full data object:', JSON.stringify(data, null, 2));
          console.log('[Profiles] First profile sample:', profiles.length > 0 ? profiles[0] : 'no profiles');
          
          // ПРИНУДИТЕЛЬНО устанавливаем профили, даже если их 0
          if (isMounted) {
            if (profiles.length > 0) {
              // Преобразуем photo_url в массив photos с правильным URL
              const processedProfiles = profiles.map(profile => {
              try {
                // Безопасная обработка interests
                let interestsArray = [];
                if (profile.interests) {
                  if (Array.isArray(profile.interests)) {
                    interestsArray = profile.interests;
                  } else if (typeof profile.interests === 'string') {
                    try {
                      interestsArray = JSON.parse(profile.interests);
                    } catch (e) {
                      console.warn('Failed to parse interests:', e);
                      interestsArray = [];
                    }
                  }
                }
                
                // Безопасная обработка goals
                let goalsArray = [];
                if (profile.goals) {
                  if (Array.isArray(profile.goals)) {
                    goalsArray = profile.goals;
                  } else if (typeof profile.goals === 'string') {
                    try {
                      goalsArray = JSON.parse(profile.goals);
                    } catch (e) {
                      console.warn('Failed to parse goals:', e);
                      goalsArray = [];
                    }
                  }
                }
                
                return {
                  ...profile,
                  interests: interestsArray,
                  goals: goalsArray,
                  photos: profile.photo_url ? [getPhotoUrl(profile.photo_url)] : []
                };
              } catch (error) {
                console.error('Error processing profile:', profile, error);
                // Возвращаем профиль с безопасными значениями по умолчанию
                return {
                  ...profile,
                  interests: [],
                  goals: [],
                  photos: profile.photo_url ? [getPhotoUrl(profile.photo_url)] : []
                };
              }
            });
              console.log('[Profiles] Setting profiles:', processedProfiles.length);
              setAllProfiles(processedProfiles);
              setCurrentIndex(0); // СБРАСЫВАЕМ ИНДЕКС
              setSwipedProfiles([]); // ОЧИЩАЕМ СВАЙПЫ
              setLoading(false);
              console.log('[Profiles] ✅ PROFILES SET! Count:', processedProfiles.length);
            } else {
              console.log('[Profiles] ⚠️ No profiles in response, setting empty array');
              setAllProfiles([]);
              setLoading(false);
            }
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[Profiles] API error:', response.status, errorText);
          if (!isMounted) return;
          setAllProfiles([]);
          setLoading(false);
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.name === 'AbortError') {
          console.warn('[Profiles] Request timeout');
        } else {
          console.error('[Profiles] Error fetching profiles:', error);
        }
        setAllProfiles([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchProfiles();
    
    return () => {
      isMounted = false;
      if (controller) {
        controller.abort();
      }
    };
  }, [isReady, userInfo?.id, activeTab, selectedCity, selectedUniversity, selectedInterests]);

  // УБРАНА фильтрация на фронтенде - фильтры применяются только на бэкенде
  // Это предотвращает двойную фильтрацию и проблемы с отображением профилей
  const filteredProfiles = allProfiles;

  // ВРЕМЕННО: отключаем фильтрацию по swipedProfiles для отладки
  // const availableProfiles = useMemo(() => 
  //   filteredProfiles.filter(profile => !swipedProfiles.includes(profile.id)),
  //   [filteredProfiles, swipedProfiles]
  // );
  const availableProfiles = filteredProfiles; // ПОКАЗЫВАЕМ ВСЕ ПРОФИЛИ БЕЗ ИСКЛЮЧЕНИЙ

  // Профили для текущей вкладки
  // Для входящих показываем только после загрузки, чтобы избежать двойного рендера
  const currentProfiles = activeTab === 'incoming' 
    ? (loadingIncoming ? [] : incomingLikes) 
    : availableProfiles;
  
  // УБЕДИТЕЛЬНАЯ проверка индекса
  const safeIndex = currentIndex >= 0 && currentIndex < currentProfiles.length ? currentIndex : 0;
  const currentProfile = currentProfiles[safeIndex];
  
  // Логируем состояние для отладки
  if (currentProfiles.length > 0 && !currentProfile) {
    console.warn('[Profiles] WARNING: currentProfiles.length > 0 but currentProfile is null!', {
      currentIndex,
      safeIndex,
      currentProfilesLength: currentProfiles.length,
      currentProfiles: currentProfiles.map(p => ({ id: p.id, name: p.name }))
    });
  }
  
  // Отладочное логирование
  useEffect(() => {
    console.log('[Profiles] State update:', {
      activeTab,
      allProfilesCount: allProfiles.length,
      filteredProfilesCount: filteredProfiles.length,
      availableProfilesCount: availableProfiles.length,
      swipedProfilesCount: swipedProfiles.length,
      currentIndex,
      currentProfile: currentProfile ? { id: currentProfile.id, name: currentProfile.name } : null,
      loading,
      loadingIncoming,
      incomingLikesCount: incomingLikes.length
    });
  }, [activeTab, allProfiles.length, filteredProfiles.length, availableProfiles.length, currentIndex, currentProfile, loading, loadingIncoming, incomingLikes.length]);

  // Сброс индекса и очистка свайпов при изменении фильтров
  useEffect(() => {
    setCurrentIndex(0);
    setSwipedProfiles([]); // Очищаем свайпы при изменении фильтров, чтобы видеть все профили
  }, [selectedCity, selectedUniversity, selectedInterests]);
  
  // Сброс индекса при изменении списка профилей
  useEffect(() => {
    if (allProfiles.length > 0) {
      console.log('[Profiles] Resetting index because allProfiles changed:', allProfiles.length);
      setCurrentIndex(0);
      setSwipedProfiles([]); // Очищаем свайпы при загрузке новых профилей
    }
  }, [allProfiles.length]);

  useEffect(() => {
    // Исправляем индекс, если он выходит за границы
    if (availableProfiles.length > 0 && (currentIndex < 0 || currentIndex >= availableProfiles.length)) {
      console.log('[Profiles] Fixing index:', { currentIndex, availableProfilesLength: availableProfiles.length });
      setCurrentIndex(0);
    }
    // Если профили загружены, но индекс не установлен, устанавливаем 0
    if (availableProfiles.length > 0 && (currentIndex === undefined || currentIndex === null)) {
      setCurrentIndex(0);
    }
  }, [currentIndex, availableProfiles.length]);

  // Функция сброса фильтров
  const handleResetFilters = () => {
    setSelectedCity('');
    setSelectedUniversity('');
    setSelectedInterests([]);
    setSwipedProfiles([]);
    setCurrentIndex(0);
  };

  /**
   * Обработчик завершения эффекта
   * Вызывается EffectOverlay после завершения анимации
   * Разблокирует свайп и применяет отложенное изменение индекса
   */
  const handleEffectComplete = () => {
    setIsEffectActive(false);
    setEffectDirection(null);
    
    // СБРОС ПОЗИЦИИ: сбрасываем swipeOffset и rotation перед появлением новой карточки
    // Это гарантирует, что новая карточка появится в ровном положении
    setSwipeOffset(0);
    
    // Применяем отложенное изменение индекса для показа следующей карточки
    if (pendingIndexChange !== null) {
      setCurrentIndex(pendingIndexChange);
      setPendingIndexChange(null);
    }
    
    // Разблокируем обработку свайпов
    isProcessingSwipe.current = false;
    
    // Прокручиваем наверх страницы
    // Оптимизация: используем instant вместо smooth для лучшей производительности
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  const handleLike = async () => {
    if (isProcessingSwipe.current || isEffectActive || !currentProfile) return;
    isProcessingSwipe.current = true;
    
    let isMatched = false;
    
    if (userInfo?.id) {
      try {
        if (activeTab === 'incoming') {
          // Для входящих лайков используем respond endpoint
          const response = await fetchWithAuth(`${API_ENDPOINTS.RESPOND_TO_LIKE}?user_id=${userInfo.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              targetUserId: currentProfile.user_id || currentProfile.id,
              action: 'accept'
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            isMatched = true; // При accept всегда мэтч
            // Удаляем из входящих
            setIncomingLikes(prev => prev.filter(p => p.id !== currentProfile.id));
          }
        } else {
          // Обычный лайк
          const response = await fetch(API_ENDPOINTS.LIKE_PROFILE(currentProfile.id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userInfo.id }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.matched) isMatched = true;
          }
        }
      } catch (error) {
        console.error('Error liking profile:', error);
      }
    }
    
    if (isMatched) {
      addMatch(currentProfile);
      alert('Вы замэтчились! 🎉');
    } else if (!userInfo?.id) {
      addMatch(currentProfile);
    }
    
    if (activeTab !== 'incoming') {
      setSwipedProfiles(prev => [...prev, currentProfile.id]);
    }
    
    const profilesLength = activeTab === 'incoming' 
      ? incomingLikes.length - 1 
      : availableProfiles.length;
    
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex < profilesLength - 1 ? prevIndex + 1 : 0;
      
      setIsEffectActive(true);
      setEffectDirection('right');
      setLastSwipeDirection('right');
      setPendingIndexChange(activeTab === 'incoming' ? Math.min(prevIndex, Math.max(0, profilesLength - 2)) : nextIndex);
      
      return prevIndex;
    });
  };

  const handlePass = async () => {
    if (isProcessingSwipe.current || isEffectActive || !currentProfile) return;
    isProcessingSwipe.current = true;
    
    if (userInfo?.id) {
      try {
        if (activeTab === 'incoming') {
          // Для входящих лайков используем respond с decline
          await fetchWithAuth(`${API_ENDPOINTS.RESPOND_TO_LIKE}?user_id=${userInfo.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              targetUserId: currentProfile.user_id || currentProfile.id,
              action: 'decline'
            }),
          });
          // Удаляем из входящих
          setIncomingLikes(prev => prev.filter(p => p.id !== currentProfile.id));
        } else {
          await fetch(API_ENDPOINTS.PASS_PROFILE(currentProfile.id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userInfo.id }),
          });
        }
      } catch (error) {
        console.error('Error passing profile:', error);
      }
    }
    
    if (activeTab !== 'incoming') {
      setSwipedProfiles(prev => [...prev, currentProfile.id]);
    }
    
    const profilesLength = activeTab === 'incoming' 
      ? incomingLikes.length - 1 
      : availableProfiles.length;
    
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex < profilesLength - 1 ? prevIndex + 1 : 0;
      
      setIsEffectActive(true);
      setEffectDirection('left');
      setLastSwipeDirection('left');
      setPendingIndexChange(activeTab === 'incoming' ? Math.min(prevIndex, Math.max(0, profilesLength - 2)) : nextIndex);
      
      return prevIndex;
    });
  };


  /**
   * ОБРАБОТКА СВАЙПОВ
   * 
   * БЛОКИРОВКА СВАЙПА:
   * - Во время проигрывания эффекта (400-700ms) свайпы полностью заблокированы
   * - Проверка isEffectActive блокирует начало, движение и завершение свайпа
   * - isProcessingSwipe предотвращает повторные вызовы handleLike/handlePass
   * - После завершения эффекта (onComplete) блокировка снимается
   * 
   * СИНХРОНИЗАЦИЯ:
   * - Свайп → эффект (неоновый хвост/fade) → блокировка → onComplete → новая карточка с glow
   * - Пользователь не может свайпнуть во время эффекта, что предотвращает баги
   */
  const handleTouchStart = (e) => {
    // БЛОКИРОВКА: предотвращаем начало свайпа во время эффекта
    if (isEffectActive || isProcessingSwipe.current) {
      e.preventDefault();
      return;
    }
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    // БЛОКИРОВКА: предотвращаем движение свайпа во время эффекта
    if (isEffectActive || !touchStartX.current || isProcessingSwipe.current) return;
    
    // Оптимизация: отменяем предыдущий RAF если он еще не выполнился
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    // Оптимизация: используем RAF для обновления состояния, чтобы не блокировать скролл
    rafId.current = requestAnimationFrame(() => {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
      
      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      
      // Если горизонтальное движение больше вертикального - это свайп
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Улучшенная отзывчивость: карточка следует за пальцем напрямую
        // Motion.div будет обрабатывать это через animate prop
        setSwipeOffset(deltaX);
      }
    });
    
    // Предотвращаем прокрутку только если это точно горизонтальный свайп
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault(); // Предотвращаем прокрутку только для горизонтальных свайпов
    }
  };

  const handleTouchEnd = () => {
    // БЛОКИРОВКА: предотвращаем завершение свайпа во время эффекта
    if (isEffectActive || isProcessingSwipe.current) {
      setSwipeOffset(0);
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
      touchEndY.current = 0;
      return;
    }
    
    if (!touchStartX.current || !touchEndX.current) {
      setSwipeOffset(0);
      return;
    }
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const minSwipeDistance = 50;

    // Проверяем, что это горизонтальный свайп
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX < 0) {
        // Свайп влево - пропустить
        handlePass();
      } else {
        // Свайп вправо - лайк
        handleLike();
      }
    } else {
      // Если свайп недостаточно большой, возвращаем карточку на место
      // Motion.div автоматически вернет её через animate prop
      setSwipeOffset(0);
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };

  if (loading) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-32 md:pb-6" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        <div className="space-y-4 mt-4">
          <Card>
            <p className="text-center text-gray-800 font-medium">
              Загрузка профилей...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[320px] max-w-md w-full mx-auto p-3 md:p-4 pb-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-3 md:space-y-4 mt-2 md:mt-4">
        {/* Таб-контрол */}
        <div className="flex gap-2 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/30">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentIndex(0);
            }}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white/30 text-gray-900'
                : 'text-gray-700 hover:bg-white/10'
            }`}
            style={activeTab === 'all' ? {
              boxShadow: '0 0 12px rgba(0, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 255, 255, 0.6)',
            } : {}}
          >
            Все анкеты
          </button>
          <button
            onClick={() => {
              setActiveTab('incoming');
              setCurrentIndex(0);
            }}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all relative ${
              activeTab === 'incoming'
                ? 'bg-white/30 text-gray-900'
                : 'text-gray-700 hover:bg-white/10'
            }`}
            style={activeTab === 'incoming' ? {
              boxShadow: '0 0 12px rgba(0, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 255, 255, 0.6)',
            } : {}}
          >
            Входящие коннекты
            {incomingLikes.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-cyan-400 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg"
                style={{ boxShadow: '0 0 8px rgba(0, 255, 255, 0.6)' }}
              >
                {incomingLikes.length}
              </span>
            )}
          </button>
        </div>

        {/* Фильтры (только для вкладки "Все анкеты") */}
        {activeTab === 'all' && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Анкеты</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm text-gray-900 rounded-lg transition-all bg-white/20 backdrop-blur-md border border-white/40"
            >
              {showFilters ? 'Скрыть' : 'Фильтры'}
            </button>
          </div>

          {showFilters && (
              <div className="space-y-3 mt-4 pt-4 border-t border-white/30">
              {(selectedCity || selectedUniversity || selectedInterests.length > 0) && (
                <button
                  onClick={handleResetFilters}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 mb-2"
                >
                  Сбросить фильтры
                </button>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Город
                </label>
                <Autocomplete
                  options={russianCities}
                  value={selectedCity}
                  onChange={setSelectedCity}
                  placeholder="Выберите город..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вуз
                </label>
                <Autocomplete
                  options={universities}
                  value={selectedUniversity}
                  onChange={setSelectedUniversity}
                  placeholder="Выберите вуз..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Интересы
                </label>
                <div className="flex flex-wrap gap-2">
                  {interests.slice(0, 8).map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        if (selectedInterests.includes(interest)) {
                          setSelectedInterests(selectedInterests.filter(i => i !== interest));
                        } else {
                          setSelectedInterests([...selectedInterests, interest]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        selectedInterests.includes(interest)
                          ? 'text-white shadow-md'
                          : 'bg-white/20 backdrop-blur-md text-gray-700 border border-white/40 hover:bg-white/30'
                      }`}
                      style={selectedInterests.includes(interest) ? {
                        background: `linear-gradient(to right, rgba(0, 255, 255, 0.26), rgba(54, 207, 255, 0.32))`,
                        boxShadow: '0 4px 12px rgba(0, 255, 255, 0.3), 0 0 8px rgba(54, 207, 255, 0.2)',
                      } : {}}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
        )}

        {/* Подсказка для вкладки входящих */}
        {activeTab === 'incoming' && showIncomingTip && (
          <div className="p-3 bg-cyan-400/20 backdrop-blur-md rounded-xl border border-cyan-400/40 text-sm text-gray-800">
            <div className="flex justify-between items-start gap-2">
              <p>💡 Эти люди уже лайкнули тебя! Свайп вправо — Connect, влево — пропустить.</p>
              <button 
                onClick={() => {
                  setShowIncomingTip(false);
                  localStorage.setItem('maxnet_incoming_tip_seen', 'true');
                }}
                className="text-gray-500 hover:text-gray-700 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Загрузка входящих лайков - убрано отображение "Загрузка..." */}

        {/* Ошибка загрузки входящих (реальная ошибка, не 404) */}
        {activeTab === 'incoming' && (incomingError === 'load_error' || incomingError === 'network_error') && !loadingIncoming && (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-800 font-medium mb-4">
                {incomingError === 'network_error' ? 'Ошибка сети' : 'Не удалось загрузить'}
              </p>
              <button
                onClick={fetchIncomingLikes}
                className="px-4 py-2 bg-cyan-400/30 text-gray-900 rounded-lg border border-cyan-400/50"
                style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}
              >
                Повторить
              </button>
            </div>
          </Card>
        )}

        {/* Пустой стейт для входящих */}
        {activeTab === 'incoming' && !loadingIncoming && incomingLikes.length === 0 && 
         (incomingError === null || incomingError === 'not_implemented') && (
          <Card>
            <div className="text-center py-8">
              <p className="text-4xl mb-3">✨</p>
              <p className="text-gray-800 font-medium mb-4">
                {incomingError === 'not_implemented' 
                  ? 'Функция скоро будет доступна!'
                  : 'Пока никто не лайкнул тебя'}
              </p>
              {incomingError === 'not_implemented' && (
                <p className="text-xs text-gray-500 mb-4">Эндпоинт ещё не реализован на бэкенде</p>
              )}
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 bg-cyan-400/30 text-gray-900 rounded-lg border border-cyan-400/50"
                style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}
              >
                Вернуться к анкетам
              </button>
            </div>
          </Card>
        )}

        {/* Пустой стейт для всех анкет */}
        {activeTab === 'all' && !loading && availableProfiles.length === 0 && allProfiles.length === 0 && (
          <Card>
            <p className="text-gray-800 text-center py-8 font-medium">
              {selectedCity || selectedUniversity || selectedInterests.length > 0
                ? 'По выбранным фильтрам ничего не найдено'
                : 'Пока нет анкет'}
            </p>
          </Card>
        )}
        
        {/* Отладочная информация - ВСЕГДА ВИДНА */}
        {activeTab === 'all' && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white text-xs p-2 z-50 font-mono">
            DEBUG: allProfiles={allProfiles.length} | availableProfiles={availableProfiles.length} | 
            currentIndex={currentIndex} | currentProfile={currentProfile ? currentProfile.name : 'NULL'} | 
            loading={loading ? 'Y' : 'N'} | user_id={userInfo?.id}
          </div>
        )}

        {/* Эффект-оверлей: отображается поверх карточки во время анимации */}
        {isEffectActive && effectDirection && (
          <EffectOverlay 
            direction={effectDirection} 
            onComplete={handleEffectComplete}
          />
        )}

        {/* Карточка профиля с плавной анимацией появления через Framer Motion */}
        {/* GLOW-АНИМАЦИЯ: после завершения эффекта карточка появляется с неоновой подсветкой */}
        <AnimatePresence mode="wait">
          {currentProfile && activeTab === 'all' && !loading && (
            <motion.div
              key={currentProfile.id}
              ref={cardRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="touch-manipulation select-none max-w-2xl mx-auto"
              style={{
                // Используем motion для плавного появления, но inline для свайпа
                // Motion не будет перезаписывать transform во время активного свайпа
                // Оптимизация: включаем GPU ускорение для карточки со свайпом
                willChange: 'transform',
                // Оптимизация: используем transform для лучшей производительности
                transform: 'translateZ(0)',
              }}
              initial={{ 
                opacity: 0, 
                y: 20, 
                scale: 0.95,
                x: 0, // Новая карточка всегда начинается с x: 0
                rotate: 0, // Новая карточка всегда начинается без наклона
                // Начальное состояние без glow
                boxShadow: '0 0 0px rgba(0, 255, 255, 0)',
              }}
              animate={{ 
                opacity: swipeOffset === 0 ? 1 : 1 - Math.abs(swipeOffset) / 300,
                y: 0,
                scale: swipeOffset === 0 ? 1 : 1,
                x: swipeOffset, // Используем motion для плавного следования за пальцем
                rotate: swipeOffset * 0.1, // Небольшой поворот при свайпе
                /**
                 * GLOW-ЭФФЕКТ: неоновая подсветка при появлении новой карточки
                 * 
                 * РЕАЛИЗАЦИЯ:
                 * - Используем box-shadow с несколькими слоями для создания свечения
                 * - Цвета: яркий голубой (#00FFFF), электрический синий (#36CFFF), белый
                 * - Glow появляется только когда карточка на месте (swipeOffset === 0) и эффект завершен
                 * - Многослойное свечение создает эффект неоновой подсветки
                 * - Уменьшенные радиус и яркость для более мягкого эффекта
                 * 
                 * СИНХРОНИЗАЦИЯ:
                 * - Glow появляется после завершения неонового хвоста (isEffectActive === false)
                 * - Анимация длится 400-500ms с небольшой задержкой для плавности
                 * - Синхронизировано с появлением новой карточки через onComplete
                 */
                boxShadow: swipeOffset === 0 && !isEffectActive
                  ? [
                      '0 0 15px rgba(0, 255, 255, 0.4)',
                      '0 0 30px rgba(54, 207, 255, 0.3)',
                      '0 0 45px rgba(0, 255, 255, 0.2)',
                    ].join(', ')
                  : '0 0 0px rgba(0, 255, 255, 0)',
              }}
              exit={lastSwipeDirection === 'left' ? {
                // ЭФФЕКТ РАСПАДА: карточка уходит влево и распадается на частицы
                opacity: 0,
                x: -600, // Уходит дальше влево за экран
                y: 150, // Большее смещение вниз для большей площади рассыпления
                scale: 0.1, // Сильнее уменьшается при распаде
                rotate: -45, // Больший поворот при уходе
                boxShadow: '0 0 0px rgba(0, 255, 255, 0)',
              } : {
                // ЭФФЕКТ УХОДА ВПРАВО: карточка уходит вправо с неоновым хвостом
                opacity: 0,
                x: 400, // Уходит вправо за экран
                y: -20,
                scale: 0.95,
                rotate: 20, // Небольшой поворот вправо
                boxShadow: '0 0 0px rgba(0, 255, 255, 0)',
              }}
              transition={(_, transitionInfo) => {
                // Разные transition в зависимости от типа анимации
                if (transitionInfo && transitionInfo.exit) {
                  // Exit анимация
                  if (lastSwipeDirection === 'left') {
                    // ЭФФЕКТ РАСПАДА: плавная анимация ухода влево
                    return {
                      x: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                      y: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                      opacity: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
                      scale: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                      rotate: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                    };
                  } else {
                    // ЭФФЕКТ УХОДА ВПРАВО: плавная анимация
                    return {
                      x: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
                      y: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
                      opacity: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
                      scale: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
                      rotate: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
                    };
                  }
                } else {
                  // Обычные transition для появления и следования за пальцем
                  return {
                    x: { type: "spring", stiffness: 200, damping: 25 },
                    opacity: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
                    rotate: { type: "spring", stiffness: 200, damping: 25 },
                    scale: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
                    boxShadow: { 
                      duration: 0.6, 
                      delay: 0.1,
                      ease: [0.25, 0.1, 0.25, 1] 
                    },
                  };
                }
              }}
            >
            <Card className="relative">
              {/* Фото профиля */}
              {(() => {
                try {
                  const photos = Array.isArray(currentProfile.photos) && currentProfile.photos.length > 0
                    ? currentProfile.photos
                    : (currentProfile.photo_url ? [getPhotoUrl(currentProfile.photo_url)] : []);
                  
                  if (photos.length > 0) {
                    return (
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`${index + 1}`}
                            className="w-full h-20 md:h-32 object-cover rounded-lg"
                            loading="lazy"
                            decoding="async"
                            style={{ willChange: 'auto' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div 
                      className="w-full h-40 md:h-64 bg-white/15 rounded-xl flex items-center justify-center mb-3 border border-white/40"
                      style={{
                        // Оптимизация: убираем backdrop-blur для статичных элементов при скролле
                        // backdrop-blur может вызывать фризы, используем только для интерактивных элементов
                        willChange: 'auto',
                      }}
                    >
                      <span className="text-4xl md:text-6xl">👤</span>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering photos:', error);
                  return (
                    <div 
                      className="w-full h-40 md:h-64 bg-white/15 rounded-xl flex items-center justify-center mb-3 border border-white/40"
                      style={{
                        // Оптимизация: убираем backdrop-blur для статичных элементов при скролле
                        // backdrop-blur может вызывать фризы, используем только для интерактивных элементов
                        willChange: 'auto',
                      }}
                    >
                      <span className="text-4xl md:text-6xl">👤</span>
                    </div>
                  );
                }
              })()}

              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                {currentProfile.name || 'Без имени'}, {currentProfile.age || '?'}
              </h2>

              <div className="space-y-2 text-xs md:text-sm mb-3">
                <div>
                  <span className="font-semibold text-gray-800">Город:</span>{' '}
                  <span className="text-gray-800 font-medium">{currentProfile.city || 'Не указан'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Вуз:</span>{' '}
                  <span className="text-gray-600 text-xs md:text-sm">{currentProfile.university || 'Не указан'}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">Интересы:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {Array.isArray(currentProfile.interests) && currentProfile.interests.length > 0
                      ? currentProfile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 bg-white/20 text-teal-700 rounded text-xs border border-white/40"
                          >
                            {interest}
                          </span>
                        ))
                      : <span className="text-gray-500 text-xs">Не указано</span>
                    }
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">Цели:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {Array.isArray(currentProfile.goals) && currentProfile.goals.length > 0
                      ? currentProfile.goals.map((goal, index) => (
                          <span
                            key={index}
                            className="px-1.5 py-0.5 bg-white/20 text-emerald-700 rounded text-xs border border-white/40"
                          >
                            {goal}
                          </span>
                        ))
                      : <span className="text-gray-500 text-xs">Не указано</span>
                    }
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">О себе:</span>
                  <p className="text-gray-800 mt-1 leading-relaxed text-xs md:text-sm line-clamp-3">{currentProfile.bio || 'Не указано'}</p>
                </div>
              </div>
            </Card>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Кнопки действий */}
        {/* БЛОКИРОВКА КНОПОК: disabled={isEffectActive || !currentProfile} 
            Блокирует клики по кнопкам во время проигрывания эффекта */}
      </div>

      {/* Модалка с объяснением свайпов */}
      {showSwipeTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowSwipeTutorial(false);
            localStorage.setItem('maxnet_swipe_tutorial_seen', 'true');
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 max-w-lg w-full border-2 border-cyan-400/50 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'La Bamba', cursive" }}>
                  Добро пожаловать в ваш персональный нетворкинг-компас!
                </h2>
                <p className="text-base text-gray-700">
                  Здесь каждый свайп – это шаг к новым возможностям. Вот как это работает:
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-50/50 rounded-xl border border-red-200/50">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="text-3xl">👈</div>
                    <p className="font-semibold text-gray-800 text-lg">Свайп влево — «Пропустить»</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed pl-11">
                    Не всё должно быть в вашем списке, и это нормально. Если этот профиль не совпадает с вашими целями или интересами, просто проведите пальцем влево — мы не будем его показывать вам снова. Это помогает вам сосредоточиться на действительно важных для вас связях.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50/50 rounded-xl border border-green-200/50">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="text-3xl">👉</div>
                    <p className="font-semibold text-gray-800 text-lg">Свайп вправо — «Лайк»</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed pl-11">
                    Нашли интересного человека? Значит стоит познакомиться! Проведите пальцем вправо, чтобы показать свой интерес и начать диалог. Чем больше лайков, тем больше шансов найти идеальных партнёров для учёбы, работы, проектов или просто общения.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSwipeTutorial(false);
                  localStorage.setItem('maxnet_swipe_tutorial_seen', 'true');
                }}
                className="w-full px-6 py-3 rounded-xl font-semibold text-white transition-all"
                style={{
                  background: `linear-gradient(to right, rgba(0, 255, 255, 0.26), rgba(54, 207, 255, 0.32))`,
                  borderColor: 'rgba(0, 255, 255, 0.5)',
                  boxShadow: '0 10px 25px rgba(0, 255, 255, 0.3), 0 0 20px rgba(54, 207, 255, 0.2)',
                }}
              >
                Понятно!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Profiles;