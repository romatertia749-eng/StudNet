import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import { useMatches } from '../contexts/MatchContext';
import HeaderConnectsBadge from './HeaderConnectsBadge';
import DebugLogs from './DebugLogs';
import { getLogs } from '../utils/debugLog';

const Header = () => {
  const navigate = useNavigate();
  const { userInfo, isReady } = useWebApp();
  const { updateConnectsCount } = useMatches();
  const [logoHeight, setLogoHeight] = useState('76.8px');
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [logsCount, setLogsCount] = useState(0);
  
  useEffect(() => {
    const updateLogsCount = () => {
      setLogsCount(getLogs().length);
    };
    updateLogsCount();
    const interval = setInterval(updateLogsCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isReady || !userInfo?.id) return;
    
    // Обновляем connectsCount с задержкой, чтобы не блокировать загрузку
    const timer = setTimeout(() => {
      updateConnectsCount(userInfo.id);
    }, 1000); // Задержка 1 секунда
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]); // Только при isReady, не при каждом изменении userInfo

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
          <button
            onClick={() => setShowDebugLogs(true)}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700 relative"
            title="Debug Logs"
          >
            🐛 Debug
            {logsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {logsCount > 99 ? '99+' : logsCount}
              </span>
            )}
          </button>
        </div>
        
        {showDebugLogs && (
          <DebugLogs onClose={() => setShowDebugLogs(false)} />
        )}
      </div>
    </header>
  );
};

export default Header;

