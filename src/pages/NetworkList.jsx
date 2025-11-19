import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { useMatches } from '../contexts/MatchContext';
import { useWebApp } from '../contexts/WebAppContext';
import { API_ENDPOINTS } from '../config/api';

const NetworkList = () => {
  const navigate = useNavigate();
  const { matchedProfiles: localMatches, addMatch } = useMatches();
  const { userInfo } = useWebApp();
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!userInfo?.id) {
        setMatchedProfiles(localMatches);
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_ENDPOINTS.MATCHES}?userId=${userInfo.id}`);
        if (response.ok) {
          const data = await response.json();
          // Преобразуем данные из API в формат для отображения
          const formattedMatches = data.map(match => ({
            id: match.matchedProfile.id,
            userId: match.matchedProfile.userId || match.matchedProfile.id,
            name: match.matchedProfile.name,
            age: match.matchedProfile.age,
            city: match.matchedProfile.city,
            university: match.matchedProfile.university,
            bio: match.matchedProfile.bio,
            interests: match.matchedProfile.interests || [],
            photos: match.matchedProfile.photoUrl ? [match.matchedProfile.photoUrl] : [],
          }));
          setMatchedProfiles(formattedMatches);
        } else {
          // Fallback на мок данные если бэкенд недоступен
          if (localMatches.length === 0) {
            setMatchedProfiles([
              {
                id: 101,
                userId: 101,
                name: 'Екатерина',
                age: 23,
                city: 'Москва',
                university: 'МГУ им. М.В. Ломоносова',
                bio: 'Студентка, увлекаюсь дизайном и маркетингом. Ищу единомышленников для совместных проектов и обмена опытом.',
                interests: ['Дизайн', 'Маркетинг', 'SMM'],
                photos: [],
              },
              {
                id: 102,
                userId: 102,
                name: 'Артём',
                age: 21,
                city: 'Санкт-Петербург',
                university: 'СПбГУ',
                bio: 'Разработчик, интересуюсь машинным обучением и AI. Ищу команду для интересных проектов и хакатонов.',
                interests: ['IT', 'Программирование', 'Наука'],
                photos: [],
              },
            ]);
          } else {
            setMatchedProfiles(localMatches);
          }
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
        // Fallback на мок данные при ошибке
        if (localMatches.length === 0) {
          setMatchedProfiles([
            {
              id: 101,
              userId: 101,
              name: 'Екатерина',
              age: 23,
              city: 'Москва',
              university: 'МГУ им. М.В. Ломоносова',
              bio: 'Студентка, увлекаюсь дизайном и маркетингом. Ищу единомышленников для совместных проектов и обмена опытом.',
              interests: ['Дизайн', 'Маркетинг', 'SMM'],
              photos: [],
            },
            {
              id: 102,
              userId: 102,
              name: 'Артём',
              age: 21,
              city: 'Санкт-Петербург',
              university: 'СПбГУ',
              bio: 'Разработчик, интересуюсь машинным обучением и AI. Ищу команду для интересных проектов и хакатонов.',
              interests: ['IT', 'Программирование', 'Наука'],
              photos: [],
            },
          ]);
        } else {
          setMatchedProfiles(localMatches);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [userInfo, localMatches]);


  return (
    <div className="min-w-[320px] min-h-[600px] max-w-4xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-4 mt-4">
        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Нет-Лист</h2>
          {loading ? (
            <p className="text-gray-800 text-center py-8 font-medium">
              Загрузка мэтчей...
            </p>
          ) : matchedProfiles.length === 0 ? (
            <p className="text-gray-800 text-center py-8 font-medium">
              Пока нет замэтченных профилей. Начните знакомиться!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchedProfiles.map((person) => (
                <Card key={person.id} className="bg-white/20 backdrop-blur-xl border-emerald-200/50">
                  <div className="flex items-start gap-3 mb-3">
                    {person.photos && person.photos.length > 0 && person.photos[0] ? (
                      <img
                        src={person.photos[0]}
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0 border border-white/40">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 mb-1">{person.name}, {person.age}</h3>
                      <p className="text-xs text-gray-500 mb-2">{person.city} • {person.university}</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{person.bio}</p>
                      {person.interests && person.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {person.interests.slice(0, 3).map((interest, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-teal-700 rounded text-xs border border-white/40"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/profiles/${person.id}`)}
                    className="w-full text-sm py-2 min-h-[40px]"
                  >
                    Посмотреть профиль
                  </Button>
                </Card>
              ))}
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

