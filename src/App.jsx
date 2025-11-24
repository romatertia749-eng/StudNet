import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useWebApp } from './contexts/WebAppContext';
import Loader from './components/Loader';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import ProfileForm from './pages/ProfileForm';
import Profiles from './pages/Profiles';
import UserCard from './pages/UserCard';
import NetworkList from './pages/NetworkList';
import NotFound from './pages/NotFound';

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
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Затемнение для лучшей читаемости контента */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none"></div>
        <main className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto -webkit-overflow-scrolling-touch pb-20 md:pb-4 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/profile/edit" element={<ProfileForm />} />
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

