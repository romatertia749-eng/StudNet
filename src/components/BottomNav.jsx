import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/profile/edit', icon: 'icon_profile', label: 'Профиль' },
    { path: '/profiles', icon: 'icon_ankets', label: 'Анкеты' },
    { path: '/network', icon: 'icon_handshake', label: 'Net-Лист' },
  ];

  const isActive = (path) => {
    if (path === '/profile/edit') {
      return location.pathname === '/profile/edit';
    }
    return location.pathname.startsWith(path);
  };
  
  const handleNavigate = (path) => {
    // #region agent log
    const navStartTime = Date.now();
    const memoryBefore = performance.memory ? {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    } : null;
    fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomNav.jsx:navigate',message:'Navigation started',data:{from:location.pathname,to:path,memoryBefore},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    navigate(path);
    
    // #region agent log
    setTimeout(() => {
      const memoryAfter = performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
      const navDuration = Date.now() - navStartTime;
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BottomNav.jsx:navigate:complete',message:'Navigation completed',data:{from:location.pathname,to:path,navDuration,memoryAfter,memoryDelta:memoryBefore&&memoryAfter?{usedJSHeapSize:memoryAfter.usedJSHeapSize-memoryBefore.usedJSHeapSize,totalJSHeapSize:memoryAfter.totalJSHeapSize-memoryBefore.totalJSHeapSize}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    }, 100);
    // #endregion
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-xl shadow-t border-t border-white/40" 
      style={{ 
        // Use Telegram safe area bottom inset to avoid navigation gestures overlap
        paddingBottom: 'calc(0.4rem + var(--tg-safe-area-bottom, env(safe-area-inset-bottom, 0px)))', 
        minHeight: '40px',
        // Оптимизация: включаем GPU ускорение для fixed bottom nav
        willChange: 'transform',
        transform: 'translateZ(0)',
        // Всегда видно при прокрутке
        position: 'fixed',
      }}
    >
      <div className="flex items-center justify-around px-2 max-w-7xl mx-auto" style={{ paddingTop: '0.4rem', paddingBottom: '0.4rem' }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 px-2 rounded-xl transition-all ${
              isActive(item.path)
                ? 'text-black bg-white/30 backdrop-blur-md'
                : 'text-black hover:text-black hover:bg-white/20'
            }`}
            style={{ 
              minHeight: '38.4px', 
              minWidth: '38.4px',
              paddingTop: '0.4rem',
              paddingBottom: '0.4rem'
            }}
          >
            <img 
              src={`/assets/stuff/${item.icon}.png`} 
              alt={item.label} 
              className="mb-1 object-contain"
              style={{ width: '19.2px', height: '19.2px' }}
            />
            <span className="text-xs font-semibold text-black">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

