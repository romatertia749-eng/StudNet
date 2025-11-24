import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6 flex flex-col justify-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-8 md:space-y-12">
        {/* Главный заголовок с градиентом */}
        <div className="text-center space-y-4 -mt-16 md:-mt-20">
          <div className="relative">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight px-2">
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                Всего одно знакомство
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
                отделяет тебя от большой
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                перемены в жизни
              </span>
            </h1>
            {/* Декоративные элементы */}
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-teal-400/20 rounded-full blur-2xl -z-10"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl -z-10"></div>
          </div>
          
          {/* Подзаголовок */}
          <p className="text-sm md:text-base text-gray-700/90 font-medium max-w-md mx-auto px-4">
            Найди единомышленников и открой новые возможности
          </p>
        </div>

        {/* Кнопки с улучшенным дизайном */}
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
          <div className="transform transition-transform hover:scale-105">
            <Button
              variant="primary"
              onClick={() => navigate('/profile/edit')}
              className="h-16 text-lg font-semibold shadow-2xl"
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <span>Профиль</span>
              </span>
            </Button>
          </div>

          <div className="transform transition-transform hover:scale-105">
            <Button
              variant="secondary"
              onClick={() => navigate('/profiles')}
              className="h-16 text-lg font-semibold shadow-2xl"
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl">💫</span>
                <span>Анкеты</span>
              </span>
            </Button>
          </div>

          <div className="transform transition-transform hover:scale-105">
            <Button
              variant="outline"
              onClick={() => navigate('/network')}
              className="h-16 text-lg font-semibold shadow-2xl"
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <span>Нет-Лист</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

