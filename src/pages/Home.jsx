import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import OnboardingMainGoal from '../components/OnboardingMainGoal';
import WelcomeCreateProfileScreen from '../components/WelcomeCreateProfileScreen';

const ExistingHomeContent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6 flex flex-col justify-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-8 md:space-y-12">
        <Card className="bg-white/30 backdrop-blur-xl border-2 border-white/50 shadow-2xl transform transition-all hover:scale-[1.02] hover:shadow-3xl">
          <div className="relative p-4 md:p-5">
            <div className="absolute -top-3 -left-3 w-24 h-24 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl -z-10"></div>
            <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl -z-10"></div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center leading-tight relative z-10" style={{ fontFamily: "'La Bamba', cursive" }}>
              Всего одно знакомство отделяет тебя от большой перемены в жизни
            </h1>
          </div>
        </Card>

        <div className="space-y-6 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
          <Button
            variant="primary"
            onClick={() => navigate('/profile/edit')}
            className="transform transition-all hover:scale-105 hover:shadow-xl"
          >
            Профиль
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/profiles')}
            className="transform transition-all hover:scale-105 hover:shadow-xl"
          >
            Анкеты
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/network')}
            className="transform transition-all hover:scale-105 hover:shadow-xl relative"
          >
            {/* Декоративная иконка сети из людей в правом верхнем углу */}
            <img
              src="/assets/stuff/сеть_из_людей_для_кнопки.png"
              alt="Сеть связей"
              className="absolute top-2 right-2 w-6 h-6 pointer-events-none z-10 opacity-80"
              style={{
                maxWidth: '28px',
                maxHeight: '28px',
              }}
            />
            Net-Лист
          </Button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { hasCompletedProfile, hasCompletedOnboarding, mainGoal } = useWebApp();

  // Если профиль не создан, показываем экран приветствия
  if (!hasCompletedProfile) {
    return <WelcomeCreateProfileScreen />;
  }

  // Если профиль создан, показываем онбординг (онбординг стал home страницей)
  return <OnboardingMainGoal />;
};

export default Home;

