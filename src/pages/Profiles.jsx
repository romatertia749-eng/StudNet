import { useState, useEffect, useRef } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
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
  const cardRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  // Защита от повторных вызовов handleLike/handlePass
  const isProcessingSwipe = useRef(false);

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
        let response;
        try {
          response = await fetchWithAuth(url);
        } catch (fetchError) {
          console.error('Error in fetchWithAuth for profile check:', fetchError);
          // Продолжаем работу, возможно бэкенд недоступен
          setCheckingProfile(false);
          return;
        }
        
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

  // Загрузка профилей с бэкенда
  useEffect(() => {
    // Не загружаем профили, пока WebApp не готов или проверяем профиль
    if (!isReady || checkingProfile) {
      console.log('WebApp not ready yet or checking profile, waiting...');
      return;
    }
    
    const fetchProfiles = async () => {
      setLoading(true);
      
      console.log('Fetching profiles, userInfo:', userInfo);
      console.log('API_ENDPOINTS.PROFILES:', API_ENDPOINTS.PROFILES);
      
      // Если нет userInfo, используем моковые данные
      if (!userInfo?.id) {
        console.warn('No userInfo.id, using mock data');
        setAllProfiles(getMockProfiles());
        setLoading(false);
        return;
      }
      
      try {
        const params = new URLSearchParams({
          user_id: userInfo.id,
          ...(selectedCity && { city: selectedCity }),
          ...(selectedUniversity && { university: selectedUniversity }),
          ...(selectedInterests.length > 0 && { interests: selectedInterests.join(',') }),
          page: 0,
          size: 50
        });
        
        const url = `${API_ENDPOINTS.PROFILES}?${params}`;
        console.log('Fetching from:', url);
        let response;
        try {
          response = await fetchWithAuth(url);
        } catch (fetchError) {
          console.error('Error in fetchWithAuth for profiles:', fetchError);
          // Fallback на мок данные при ошибке сети
          setAllProfiles(getMockProfiles());
          setLoading(false);
          return;
        }
        console.log('Response status:', response.status);
        if (response.ok) {
          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Error parsing response JSON:', parseError);
            setAllProfiles(getMockProfiles());
            setLoading(false);
            return;
          }
          console.log('Received data:', data);
          const profiles = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
          
          // Если список пустой, возможно профиля пользователя нет
          // Но это может быть и потому, что нет других профилей
          // Проверяем через get_available_profiles - если профиля нет, он вернет пустой список
          // Но это не надежно, поэтому лучше проверить отдельно
          
          if (profiles.length === 0) {
            // Может быть пусто потому что нет других профилей или нет профиля пользователя
            // Проверяем через отдельный запрос
            console.log('Empty response, checking if user has profile...');
            // Если это первый запрос и список пустой, возможно профиля нет
            // Но для надежности лучше проверить отдельно
            setAllProfiles([]);
          } else {
            console.log('Using backend data, profiles count:', profiles.length);
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
            setAllProfiles(processedProfiles);
          }
        } else {
          console.error('Response not OK, status:', response.status);
          // Fallback на мок данные если бэкенд недоступен
          setAllProfiles(getMockProfiles());
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
        // Fallback на мок данные при ошибке
        setAllProfiles(getMockProfiles());
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [isReady, userInfo, selectedCity, selectedUniversity, selectedInterests, checkingProfile, navigate]);

  // Фильтрация на фронтенде (для мок данных или дополнительная фильтрация)
  const filteredProfiles = allProfiles.filter(profile => {
    try {
      if (selectedCity && profile.city !== selectedCity) return false;
      if (selectedUniversity && profile.university !== selectedUniversity) return false;
      if (selectedInterests.length > 0) {
        const interests = Array.isArray(profile.interests) ? profile.interests : [];
        const hasInterest = selectedInterests.some(interest =>
          interests.includes(interest)
        );
        if (!hasInterest) return false;
      }
      return true;
    } catch (error) {
      console.error('Error filtering profile:', profile, error);
      return false;
    }
  });

  const availableProfiles = filteredProfiles.filter(profile => 
    !swipedProfiles.includes(profile.id)
  );

  const currentProfile = availableProfiles[currentIndex];

  // Сброс индекса и очистка свайпов при изменении фильтров
  useEffect(() => {
    setCurrentIndex(0);
    setSwipedProfiles([]); // Очищаем свайпы при изменении фильтров, чтобы видеть все профили
  }, [selectedCity, selectedUniversity, selectedInterests]);
  
  // Сброс индекса при изменении списка профилей
  useEffect(() => {
    if (allProfiles.length > 0) {
      setCurrentIndex(0);
    }
  }, [allProfiles.length]);

  useEffect(() => {
    if (currentIndex >= availableProfiles.length && availableProfiles.length > 0) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async () => {
    // Защита от повторных вызовов - предотвращает двойное пролистывание
    if (isProcessingSwipe.current || isEffectActive || !currentProfile) return;
    
    // Блокируем повторные вызовы
    isProcessingSwipe.current = true;
    
    let isMatched = false;
    
    // Отправляем запрос на бэкенд только если есть userInfo
    if (userInfo?.id) {
    try {
      const response = await fetch(API_ENDPOINTS.LIKE_PROFILE(currentProfile.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userInfo.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.matched) {
            isMatched = true;
          alert('Вы замэтчились!');
        }
      }
    } catch (error) {
      console.error('Error liking profile:', error);
      // Продолжаем работу даже при ошибке
      }
    }
    
    // Добавляем в мэтчи только если был мэтч или если нет userInfo (для моковых данных)
    if (isMatched || !userInfo?.id) {
    addMatch(currentProfile);
    }
    
    // Добавляем в свайпы
    setSwipedProfiles(prev => [...prev, currentProfile.id]);
    
    // Вычисляем следующий индекс на основе текущего состояния
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex < availableProfiles.length - 1 
        ? prevIndex + 1 
        : 0;
      
      // Активируем эффект конфетти (направление "right")
      setIsEffectActive(true);
      setEffectDirection('right');
      setPendingIndexChange(nextIndex);
      
      return prevIndex; // Не меняем индекс сразу, ждем завершения эффекта
    });
  };

  const handlePass = async () => {
    // Защита от повторных вызовов - предотвращает двойное пролистывание
    if (isProcessingSwipe.current || isEffectActive || !currentProfile) return;
    
    // Блокируем повторные вызовы
    isProcessingSwipe.current = true;
    
    // Отправляем запрос на бэкенд только если есть userInfo
    if (userInfo?.id) {
    try {
      await fetch(API_ENDPOINTS.PASS_PROFILE(currentProfile.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userInfo.id }),
      });
    } catch (error) {
      console.error('Error passing profile:', error);
      // Продолжаем работу даже при ошибке
      }
    }
    
    setSwipedProfiles(prev => [...prev, currentProfile.id]);
    
    // Вычисляем следующий индекс на основе текущего состояния
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex < availableProfiles.length - 1 
        ? prevIndex + 1 
        : 0;
      
      // Активируем эффект fade/disperse (направление "left")
      setIsEffectActive(true);
      setEffectDirection('left');
      setPendingIndexChange(nextIndex);
      
      return prevIndex; // Не меняем индекс сразу, ждем завершения эффекта
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
    
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    
    // Если горизонтальное движение больше вертикального - это свайп
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault(); // Предотвращаем прокрутку
      // Улучшенная отзывчивость: карточка следует за пальцем напрямую
      // Motion.div будет обрабатывать это через animate prop
      setSwipeOffset(deltaX);
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

  if (checkingProfile || loading) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-32 md:pb-6" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        <div className="space-y-4 mt-4">
          <Card>
            <p className="text-center text-gray-800 font-medium">
              {checkingProfile ? 'Проверка профиля...' : 'Загрузка профилей...'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentProfile && availableProfiles.length === 0) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-32 md:pb-6" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        <div className="space-y-4 mt-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Анкеты</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 text-sm rounded-lg transition-colors"
                style={{
                  color: 'rgba(0, 255, 255, 0.8)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {showFilters ? 'Скрыть' : 'Фильтры'}
              </button>
            </div>

            {showFilters && (
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
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
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          selectedInterests.includes(interest)
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-800 text-center py-8 font-medium">
              {selectedCity || selectedUniversity || selectedInterests.length > 0
                ? 'По выбранным фильтрам ничего не найдено'
                : 'Пока нет анкет'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-md w-full mx-auto p-3 md:p-4 pb-24 md:pb-32" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-3 md:space-y-4 mt-2 md:mt-4">
        {/* Фильтры */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Анкеты</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm rounded-lg transition-all bg-white/20 backdrop-blur-md border border-white/40"
              style={{
                color: 'rgba(0, 255, 255, 0.8)',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
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
          {currentProfile && (
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
                 * 
                 * СИНХРОНИЗАЦИЯ:
                 * - Glow появляется после завершения неонового хвоста (isEffectActive === false)
                 * - Анимация длится 400-500ms с небольшой задержкой для плавности
                 * - Синхронизировано с появлением новой карточки через onComplete
                 */
                boxShadow: swipeOffset === 0 && !isEffectActive
                  ? [
                      '0 0 25px rgba(0, 255, 255, 0.7)',
                      '0 0 50px rgba(54, 207, 255, 0.5)',
                      '0 0 75px rgba(0, 255, 255, 0.3)',
                      '0 0 100px rgba(255, 255, 255, 0.2)',
                    ].join(', ')
                  : '0 0 0px rgba(0, 255, 255, 0)',
              }}
              exit={{ 
                opacity: 0, 
                y: -20, 
                scale: 0.95,
                boxShadow: '0 0 0px rgba(0, 255, 255, 0)',
              }}
              transition={{ 
                x: { type: "spring", stiffness: 300, damping: 30 }, // Пружинная анимация для лучшей отзывчивости
                opacity: { duration: 0.2 },
                rotate: { type: "spring", stiffness: 300, damping: 30 },
                scale: { duration: 0.3, ease: 'easeOut' },
                // GLOW-АНИМАЦИЯ: плавное появление свечения за 400-500ms
                boxShadow: { 
                  duration: 0.5, 
                  delay: 0.1, // Небольшая задержка для синхронизации с появлением карточки
                  ease: 'easeOut' 
                },
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
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div className="w-full h-40 md:h-64 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mb-3 border border-white/40">
                      <span className="text-4xl md:text-6xl">👤</span>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering photos:', error);
                  return (
                    <div className="w-full h-40 md:h-64 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mb-3 border border-white/40">
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
                            className="px-1.5 py-0.5 bg-white/20 backdrop-blur-md text-teal-700 rounded text-xs border border-white/40"
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
                            className="px-1.5 py-0.5 bg-white/20 backdrop-blur-md text-emerald-700 rounded text-xs border border-white/40"
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
        <div className="flex items-center justify-center gap-4 md:gap-6 pt-2 md:pt-4 max-w-2xl mx-auto">
          <button
            onClick={handlePass}
            disabled={isEffectActive || !currentProfile}
            className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center justify-center text-2xl md:text-4xl shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Пропустить"
          >
            ✕
          </button>

          <button
            onClick={handleLike}
            disabled={isEffectActive || !currentProfile}
            className="w-14 h-14 md:w-20 md:h-20 rounded-full text-white flex items-center justify-center text-2xl md:text-4xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, rgba(0, 255, 255, 0.26), rgba(54, 207, 255, 0.32))`,
              boxShadow: '0 10px 25px rgba(0, 255, 255, 0.3), 0 0 20px rgba(54, 207, 255, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!isEffectActive && currentProfile) {
                e.target.style.boxShadow = '0 15px 35px rgba(0, 255, 255, 0.4), 0 0 30px rgba(54, 207, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEffectActive && currentProfile) {
                e.target.style.boxShadow = '0 10px 25px rgba(0, 255, 255, 0.3), 0 0 20px rgba(54, 207, 255, 0.2)';
              }
            }}
            aria-label="Лайк"
          >
            ❤️
          </button>
        </div>

        {/* Подсказка для свайпов */}
        <p className="text-xs text-gray-500 text-center mt-1 md:mt-2">
          Свайп влево = пропустить, вправо = лайк
        </p>
      </div>
    </div>
  );
};

export default Profiles;
