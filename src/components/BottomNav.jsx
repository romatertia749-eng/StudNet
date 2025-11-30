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

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-xl shadow-t border-t border-white/40" 
      style={{ 
        // Use Telegram safe area bottom inset to avoid navigation gestures overlap
        paddingBottom: 'calc(0.5rem + var(--tg-safe-area-bottom, env(safe-area-inset-bottom, 0px)))', 
        minHeight: '50px',
        // Оптимизация: включаем GPU ускорение для fixed bottom nav
        willChange: 'transform',
        transform: 'translateZ(0)',
        // Всегда видно при прокрутке
        position: 'fixed',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-7xl mx-auto">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-xl transition-all min-h-[48px] min-w-[48px] ${
              isActive(item.path)
                ? 'text-black bg-white/30 backdrop-blur-md'
                : 'text-black hover:text-black hover:bg-white/20'
            }`}
          >
            <img 
              src={`/assets/stuff/${item.icon}.png`} 
              alt={item.label} 
              className="w-6 h-6 mb-1 object-contain"
            />
            <span className="text-xs font-semibold text-black">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

