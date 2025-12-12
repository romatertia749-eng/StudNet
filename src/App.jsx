import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
// import OnboardingMainGoal from './components/OnboardingMainGoal'; // ВРЕМЕННО ОТКЛЮЧЕНО

function AppContent() {
  const location = useLocation();
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:routeChange',message:'Route changed',data:{pathname:location.pathname,search:location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }, [location.pathname]);
  // #endregion
  
  return (
    <>
      <Header />
      <main 
        className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto -webkit-overflow-scrolling-touch pb-20 md:pb-20 relative"
        style={{
          zIndex: 2,
          willChange: 'scroll-position',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
          paddingBottom: '4rem',
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/welcome" element={<Home />} />
          <Route path="/profile/edit" element={<ProfileForm />} />
          {/* ВРЕМЕННО ОТКЛЮЧЕНО: онбординг с целями */}
          {/* <Route path="/onboarding-main-goal" element={<OnboardingMainGoal />} /> */}
          <Route path="/onboarding-main-goal" element={<Navigate to="/profiles" replace />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:id" element={<UserCard />} />
          <Route path="/network" element={<NetworkList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  );
}

function App() {
  const { isReady } = useWebApp();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // ВРЕМЕННО ОТКЛЮЧЕНО: загрузка фонового изображения (9MB - может вызывать проблемы производительности)
  // Агрессивная предзагрузка фонового изображения
  useEffect(() => {
    // ВРЕМЕННО: не загружаем фон для тестирования производительности
    setBackgroundLoaded(false); // Всегда false - используем только градиент
    return;
    
    /* ОРИГИНАЛЬНЫЙ КОД - ЗАКОММЕНТИРОВАН
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
    */
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
        {/* ВРЕМЕННО ОТКЛЮЧЕНО: фоновое изображение (9MB) - используем только градиент */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            zIndex: 0,
          }}
        />
        
        {/* ВРЕМЕННО ОТКЛЮЧЕНО: фоновое изображение
        {!backgroundLoaded && (
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              zIndex: 0,
            }}
          />
        )}
        
        <img
          src="/assets/stuff/background.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: backgroundLoaded ? 1 : 0,
            transition: backgroundLoaded ? 'opacity 0.1s ease-in' : 'none',
            zIndex: 0,
            willChange: 'opacity',
            imageRendering: 'auto',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          crossOrigin="anonymous"
        />
        */}
        
        {/* Затемнение для лучшей читаемости контента */}
        <div 
          className="absolute inset-0 bg-white/20 pointer-events-none"
          style={{
            zIndex: 1,
            willChange: 'auto',
          }}
        />
        <AppContent />
      </div>
    </Router>
  );
}

export default App;

