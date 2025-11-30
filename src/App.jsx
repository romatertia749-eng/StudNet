import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useWebApp } from './contexts/WebAppContext';
import Loader from './components/Loader';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ProfileForm from './pages/ProfileForm';
import Profiles from './pages/Profiles';
import UserCard from './pages/UserCard';
import NetworkList from './pages/NetworkList';
import NotFound from './pages/NotFound';
import OnboardingMainGoal from './components/OnboardingMainGoal';

function App() {
  const { isReady } = useWebApp();

  if (!isReady) {
    return <Loader />;
  }

  return (
    <Router>
      <div 
        className="min-h-screen min-h-[100dvh] flex flex-col relative overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/stuff/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          // Убрали backgroundAttachment: 'fixed' - это вызывает рефлоу при каждом скролле
          // Вместо этого используем статичный фон для лучшей производительности
        }}
      >
        {/* Затемнение для лучшей читаемости контента - оптимизировано для скролла */}
        <div 
          className="absolute inset-0 bg-white/20 pointer-events-none"
          style={{
            // Убрали backdrop-blur для лучшей производительности при скролле
            // Используем только opacity для затемнения
            willChange: 'auto', // Не нужно GPU ускорение для статичного элемента
          }}
        ></div>
        <Header />
        <main 
          className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto -webkit-overflow-scrolling-touch pb-20 md:pb-4 relative z-10"
          style={{
            // Оптимизация для плавного скролла
            willChange: 'scroll-position',
            // Включаем аппаратное ускорение для прокручиваемого контента
            transform: 'translateZ(0)',
            // Предотвращаем лишние рефлоу
            contain: 'layout style paint',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/welcome" element={<Home />} />
            <Route path="/profile/edit" element={<ProfileForm />} />
            <Route path="/onboarding-main-goal" element={<OnboardingMainGoal />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/profiles/:id" element={<UserCard />} />
            <Route path="/network" element={<NetworkList />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;

