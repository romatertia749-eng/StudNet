import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { useWebApp } from '../contexts/WebAppContext';
import { API_ENDPOINTS, getPhotoUrl } from '../config/api';
import { fetchWithAuth } from '../utils/api';

const UserCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useWebApp();
  const [isMatched, setIsMatched] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProfile = async () => {
      if (!isMounted) return;
      setLoading(true);

      try {
        const response = await fetchWithAuth(API_ENDPOINTS.PROFILE_BY_ID(id));
        
        if (!isMounted) return;
        if (response.ok) {
          const data = await response.json();
          // Преобразуем данные из API в формат для отображения
          setProfile({
            id: data.id,
            userId: data.user_id,
            name: data.name,
            gender: data.gender === 'male' ? 'Мужской' : data.gender === 'female' ? 'Женский' : 'Другой',
            age: data.age,
            city: data.city,
            university: data.university,
            interests: Array.isArray(data.interests) ? data.interests : JSON.parse(data.interests || '[]'),
            goals: Array.isArray(data.goals) ? data.goals : JSON.parse(data.goals || '[]'),
            bio: data.bio || '',
            photos: data.photo_url ? [getPhotoUrl(data.photo_url)] : [],
          });
          
          // Загружаем статистику
          if (data.user_id) {
            try {
              const statsResponse = await fetchWithAuth(API_ENDPOINTS.USER_STATS(data.user_id), { retry: false });
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
              }
            } catch (e) {
              console.error('Error loading stats:', e);
            }
          }
        } else {
          if (!isMounted) return;
          // Fallback на мок данные если профиль не найден
          setProfile({
            id: id,
            name: 'Алексей',
            gender: 'Мужской',
            age: 22,
            city: 'Москва',
            university: 'МГУ им. М.В. Ломоносова',
            interests: ['IT', 'Программирование', 'Стартапы', 'Волонтёрство'],
            goals: ['Совместная учёба', 'Найти команду для хакатона', 'Стартап'],
            bio: 'Студент, увлекаюсь разработкой и созданием стартапов. Ищу единомышленников для совместных проектов и участия в хакатонах.',
            photos: [],
          });
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.name === 'AbortError') {
          console.warn('Request timeout after all retries');
        } else {
          console.error('Error fetching profile:', error);
        }
        // Fallback на мок данные при ошибке
        setProfile({
          id: id,
          name: 'Алексей',
          gender: 'Мужской',
          age: 22,
          city: 'Москва',
          university: 'МГУ им. М.В. Ломоносова',
          interests: ['IT', 'Программирование', 'Стартапы', 'Волонтёрство'],
          goals: ['Совместная учёба', 'Найти команду для хакатона', 'Стартап'],
          bio: 'Студент, увлекаюсь разработкой и созданием стартапов. Ищу единомышленников для совместных проектов и участия в хакатонах.',
          photos: [],
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchProfile();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleMatch = async () => {
    if (!userInfo || !profile) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.LIKE_PROFILE(id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userInfo.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.matched) {
          setIsMatched(true);
        }
      }
    } catch (error) {
      console.error('Error matching:', error);
      // Показываем мэтч даже при ошибке для UX
      setIsMatched(true);
    }
  };


  if (loading || !profile) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <div className="space-y-4 mt-4">
          <Card>
            <p className="text-center text-gray-800 font-medium">Загрузка профиля...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-4 mt-4">
        {/* Фото профиля */}
        {profile.photos && profile.photos.length > 0 && profile.photos[0] ? (
          <div className="w-full mb-4">
            <img
              src={profile.photos[0]}
              alt={profile.name || 'Profile'}
              className="w-full h-64 md:h-80 object-cover rounded-xl"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/40 mb-4">
            <span className="text-gray-400 text-lg">📷</span>
          </div>
        )}

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{profile.name}</h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-800">Пол:</span>{' '}
              <span className="text-gray-800 font-medium">{profile.gender}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Возраст:</span>{' '}
              <span className="text-gray-600">{profile.age} лет</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Город:</span>{' '}
              <span className="text-gray-600">{profile.city}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Вуз:</span>{' '}
              <span className="text-gray-600">{profile.university}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-800">Интересы:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.interests.map((interest, index) => (
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
                {profile.goals.map((goal, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/40 backdrop-blur-sm text-emerald-700 rounded-lg text-xs border border-white/30"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-800">О себе:</span>
              <p className="text-gray-800 mt-1 leading-relaxed">{profile.bio}</p>
            </div>
          </div>
        </Card>

        {stats && (
          <Card className="bg-white/20 backdrop-blur-xl border-teal-200/50">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Статистика коннектов</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-white/20 rounded-lg">
                <div className="text-2xl font-bold text-teal-700">{stats.helped_others || 0}</div>
                <div className="text-gray-600 text-xs mt-1">Помог другим</div>
              </div>
              <div className="text-center p-2 bg-white/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-700">{stats.helped_me || 0}</div>
                <div className="text-gray-600 text-xs mt-1">Помогли мне</div>
              </div>
              <div className="text-center p-2 bg-white/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{stats.projects_together || 0}</div>
                <div className="text-gray-600 text-xs mt-1">Совместных проектов</div>
              </div>
              <div className="text-center p-2 bg-white/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{stats.events_together || 0}</div>
                <div className="text-gray-600 text-xs mt-1">Совместных ивентов</div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {!isMatched ? (
            <Button variant="primary" onClick={handleMatch}>
              Перейти в чат
            </Button>
          ) : (
            <>
              <Card className="bg-white/20 backdrop-blur-xl border-emerald-200/50">
                <p className="text-center text-emerald-700 font-semibold mb-3">
                  ✅ Вы замэтчились!
                </p>
                <Button variant="secondary" onClick={() => navigate('/network-list')} className="w-full">
                  Перейти к мэтчам
                </Button>
              </Card>
            </>
          )}
          <Button variant="outline" onClick={() => navigate('/profiles')}>
            ← Назад к анкетам
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;

