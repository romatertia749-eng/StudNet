import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Агрессивная предзагрузка фонового изображения
  useEffect(() => {
    let isMounted = true;
    
    // Создаем изображение с максимальным приоритетом
    const img = new Image();
    img.src = '/assets/stuff/background.jpg';
    if (img.fetchPriority !== undefined) {
      img.fetchPriority = 'high';
    }
    
    // Пытаемся загрузить сразу
    img.onload = () => {
      if (isMounted) {
        setBackgroundLoaded(true);
      }
    };
    img.onerror = () => {
      // Если не загрузилось, все равно показываем приложение
      if (isMounted) {
        setBackgroundLoaded(true);
      }
    };
    
    // Дополнительная попытка через небольшую задержку
    const timeoutId = setTimeout(() => {
      if (isMounted && !img.complete) {
        const img2 = new Image();
        img2.src = '/assets/stuff/background.jpg';
        if (img2.fetchPriority !== undefined) {
          img2.fetchPriority = 'high';
        }
        img2.onload = () => {
          if (isMounted) setBackgroundLoaded(true);
        };
        img2.onerror = () => {
          if (isMounted) setBackgroundLoaded(true);
        };
      }
    }, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isReady) {
    return <Loader />;
  }

  return (
    <Router basename={process.env.PUBLIC_URL || ""}>
      <div 
        className="flex flex-col relative overflow-hidden"
        style={{
          height: '100vh',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Placeholder градиент пока грузится фон */}
        {!backgroundLoaded && (
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              zIndex: 0,
            }}
          />
        )}
        
        {/* Фоновое изображение с максимальной оптимизацией загрузки */}
        <img
          src="/assets/stuff/background.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: backgroundLoaded ? 1 : 0,
            transition: backgroundLoaded ? 'opacity 0.1s ease-in' : 'none',
            zIndex: 0,
            willChange: 'opacity',
            // Оптимизация рендеринга
            imageRendering: 'auto',
            // Принудительное использование GPU для плавности
            transform: 'translateZ(0)',
            // Отключаем сглаживание для более быстрого рендеринга
            backfaceVisibility: 'hidden',
          }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          crossOrigin="anonymous"
        />
        
        {/* Затемнение для лучшей читаемости контента */}
        <div 
          className="absolute inset-0 bg-white/20 pointer-events-none"
          style={{
            zIndex: 1,
            willChange: 'auto',
          }}
        />
        <Header />
        <main 
          className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto -webkit-overflow-scrolling-touch pb-20 md:pb-20 relative"
          style={{
            zIndex: 2,
            // Оптимизация для плавного скролла
            willChange: 'scroll-position',
            // Включаем аппаратное ускорение для прокручиваемого контента
            transform: 'translateZ(0)',
            // Предотвращаем лишние рефлоу
            contain: 'layout style paint',
            // Отступ снизу для fixed bottom nav (уменьшен на 20%)
            paddingBottom: '4rem',
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;

