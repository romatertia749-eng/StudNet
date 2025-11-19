import { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import Autocomplete from '../components/Autocomplete';
import { russianCities, universities, interests } from '../data/formData';
import { useMatches } from '../contexts/MatchContext';
import { useWebApp } from '../contexts/WebAppContext';
import { API_ENDPOINTS } from '../config/api';
import { fetchWithAuth } from '../utils/api';

const Profiles = () => {
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
  const cardRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

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

  // Загрузка профилей с бэкенда
  useEffect(() => {
    // Не загружаем профили, пока WebApp не готов
    if (!isReady) {
      console.log('WebApp not ready yet, waiting...');
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
        const response = await fetchWithAuth(url);
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Received data:', data);
          const profiles = data.content || [];
          // Если бэкенд вернул пустой массив, используем моковые данные
          if (profiles.length === 0) {
            console.log('Empty response, using mock data');
            setAllProfiles(getMockProfiles());
          } else {
            console.log('Using backend data, profiles count:', profiles.length);
            setAllProfiles(profiles);
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
  }, [isReady, userInfo, selectedCity, selectedUniversity, selectedInterests]);

  // Фильтрация на фронтенде (для мок данных или дополнительная фильтрация)
  const filteredProfiles = allProfiles.filter(profile => {
    if (selectedCity && profile.city !== selectedCity) return false;
    if (selectedUniversity && profile.university !== selectedUniversity) return false;
    if (selectedInterests.length > 0) {
      const hasInterest = selectedInterests.some(interest =>
        profile.interests && profile.interests.includes(interest)
      );
      if (!hasInterest) return false;
    }
    return true;
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

  const handleLike = async () => {
    if (!currentProfile) return;
    
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
    
    // Добавляем в свайпы и переходим к следующей карточке
    setSwipedProfiles([...swipedProfiles, currentProfile.id]);
    
    if (currentIndex < availableProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePass = async () => {
    if (!currentProfile) return;
    
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
    
    setSwipedProfiles([...swipedProfiles, currentProfile.id]);
    
    // Переход к следующей карточке
    if (currentIndex < availableProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };


  // Обработка свайпов
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    
    // Если горизонтальное движение больше вертикального - это свайп
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault(); // Предотвращаем прокрутку
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
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
    }
    
    setSwipeOffset(0);
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
            <p className="text-center text-gray-800 font-medium">Загрузка профилей...</p>
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
                className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
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
    <div className="min-w-[320px] min-h-[600px] max-w-md w-full mx-auto p-4 pb-32" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-4 mt-4">
        {/* Фильтры */}
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Анкеты</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm text-teal-600 hover:bg-white/30 rounded-lg transition-all bg-white/20 backdrop-blur-md border border-white/40"
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
                          ? 'bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-md'
                          : 'bg-white/20 backdrop-blur-md text-gray-700 border border-white/40 hover:bg-white/30'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Карточка профиля */}
        {currentProfile && (
          <div
            ref={cardRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="touch-manipulation select-none max-w-2xl mx-auto"
            style={{
              transform: `translateX(${swipeOffset}px)`,
              transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
              opacity: swipeOffset !== 0 ? 1 - Math.abs(swipeOffset) / 300 : 1,
            }}
          >
            <Card className="relative">
              {/* Фото профиля */}
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {currentProfile.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full h-64 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/40">
                  <span className="text-6xl">👤</span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {currentProfile.name}, {currentProfile.age}
              </h2>

              <div className="space-y-3 text-sm mb-4">
                <div>
                  <span className="font-semibold text-gray-800">Город:</span>{' '}
                  <span className="text-gray-800 font-medium">{currentProfile.city}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Вуз:</span>{' '}
                  <span className="text-gray-600">{currentProfile.university}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">Интересы:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/20 backdrop-blur-md text-teal-700 rounded-lg text-xs border border-white/40"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">Цели:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentProfile.goals.map((goal, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/20 backdrop-blur-md text-emerald-700 rounded-lg text-xs border border-white/40"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">О себе:</span>
                  <p className="text-gray-800 mt-1 leading-relaxed">{currentProfile.bio}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center justify-center gap-6 pt-4 max-w-2xl mx-auto">
          <button
            onClick={handlePass}
            disabled={!currentProfile}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center justify-center text-3xl md:text-4xl shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Пропустить"
          >
            ✕
          </button>

          <button
            onClick={handleLike}
            disabled={!currentProfile}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl md:text-4xl shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/60 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Лайк"
          >
            ❤️
          </button>
        </div>

        {/* Подсказка для свайпов */}
        <p className="text-xs text-gray-500 text-center mt-2">
          Свайп влево = пропустить, вправо = лайк
        </p>
      </div>
    </div>
  );
};

export default Profiles;
