import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import { useMatches } from '../contexts/MatchContext';
import { API_ENDPOINTS } from '../config/api';
import HeaderConnectsBadge from './HeaderConnectsBadge';

const Header = () => {
  const navigate = useNavigate();
  const { userInfo, isReady } = useWebApp();
  const { updateConnectsCount } = useMatches();

  useEffect(() => {
    if (!isReady || !userInfo?.id) return;
    
    // Обновляем connectsCount при загрузке
    updateConnectsCount(userInfo.id);
  }, [isReady, userInfo, updateConnectsCount]);

  return (
    <header className="sticky top-0 z-50 bg-white/20 backdrop-blur-xl shadow-xl border-b border-white/40">
      <div className="px-4 md:px-6 py-1 max-w-7xl mx-auto flex items-center justify-between gap-2" style={{ paddingTop: 'calc(0.25rem + env(safe-area-inset-top))', paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          aria-label="На главную"
        >
          <img
            src="/assets/stuff/logo.png"
            alt="Logo"
            className="h-24 md:h-28 w-auto object-contain"
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

