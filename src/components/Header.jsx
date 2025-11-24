const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/20 backdrop-blur-xl shadow-xl border-b border-white/40">
      <div className="px-4 md:px-6 py-3 max-w-7xl mx-auto" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      </div>
    </header>
  );
};

export default Header;

