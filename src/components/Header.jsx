import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import { useMatches } from '../contexts/MatchContext';
import { API_ENDPOINTS } from '../config/api';
import HeaderConnectsBadge from './HeaderConnectsBadge';

const Header = () => {
  const navigate = useNavigate();
  const { userInfo, isReady } = useWebApp();
  const { updateConnectsCount } = useMatches();
  const [logoHeight, setLogoHeight] = useState('76.8px');

  useEffect(() => {
    if (!isReady || !userInfo?.id) return;
    
    // Обновляем connectsCount при загрузке
    updateConnectsCount(userInfo.id);
  }, [isReady, userInfo, updateConnectsCount]);

  useEffect(() => {
    const updateLogoSize = () => {
      setLogoHeight(window.innerWidth >= 768 ? '89.6px' : '76.8px');
    };
    
    updateLogoSize();
    window.addEventListener('resize', updateLogoSize);
    return () => window.removeEventListener('resize', updateLogoSize);
  }, []);

  return (
    <header 
      className="sticky top-0 z-50 bg-white/20 backdrop-blur-xl shadow-xl border-b border-white/40"
      style={{
        // Оптимизация: включаем GPU ускорение для sticky header
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <div 
        className="px-4 md:px-6 max-w-7xl mx-auto flex items-center justify-between gap-2" 
        style={{ 
          // Use Telegram safe area top inset to avoid status bar/notch overlap
          paddingTop: 'calc(0.2rem + var(--tg-safe-area-top, env(safe-area-inset-top, 0px)))', 
          paddingBottom: 'calc(0.2rem + var(--tg-safe-area-bottom, env(safe-area-inset-bottom, 0px)))' 
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          aria-label="На главную"
        >
          <img
            src="/assets/stuff/logo.png"
            alt="Logo"
            className="w-auto object-contain"
            style={{ 
              height: logoHeight
            }}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <HeaderConnectsBadge />
        </div>
      </div>
    </header>
  );
};

export default Header;

