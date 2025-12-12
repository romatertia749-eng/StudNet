import { useWebApp } from '../contexts/WebAppContext';
import OnboardingMainGoal from '../components/OnboardingMainGoal';
import WelcomeCreateProfileScreen from '../components/WelcomeCreateProfileScreen';

const Home = () => {
  const { hasCompletedProfile } = useWebApp();

  // Если профиль не создан, показываем экран приветствия
  if (!hasCompletedProfile) {
    return <WelcomeCreateProfileScreen />;
  }

  // Если профиль создан, показываем онбординг (онбординг стал home страницей)
  return <OnboardingMainGoal />;
};

export default Home;

