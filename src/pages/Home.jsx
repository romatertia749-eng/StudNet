import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
// import OnboardingMainGoal from '../components/OnboardingMainGoal'; // ВРЕМЕННО ОТКЛЮЧЕНО
import WelcomeCreateProfileScreen from '../components/WelcomeCreateProfileScreen';
import { API_ENDPOINTS } from '../config/api';

const Home = () => {
  const navigate = useNavigate();
  const { hasCompletedProfile, setHasCompletedProfile, userInfo } = useWebApp();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const checkProfileExists = async () => {
      // #region agent log
      const checkStartTime = Date.now();
      const localStorageProfile = localStorage.getItem('mn_hasCompletedProfile');
      fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.jsx:checkProfileExists:start',message:'Starting profile check',data:{hasCompletedProfile,localStorageProfile,userId:localStorage.getItem('user_id')||userInfo?.id,userInfoId:userInfo?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      const userId = localStorage.getItem('user_id') || userInfo?.id;
      
      if (!userId) {
        setIsCheckingProfile(false);
        return;
      }

      if (hasCompletedProfile) {
        setIsCheckingProfile(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.jsx:checkProfileExists:skip',message:'Skipping check - hasCompletedProfile is true',data:{hasCompletedProfile,checkDuration:Date.now()-checkStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.CHECK_PROFILE(userId));
        if (response.ok) {
          const data = await response.json();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.jsx:checkProfileExists:response',message:'Profile check response',data:{exists:data.exists,status:response.status,checkDuration:Date.now()-checkStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
          // #endregion
          if (data.exists) {
            setHasCompletedProfile(true);
          }
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8b72b830-67b6-40e1-815d-599564ead6f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Home.jsx:checkProfileExists:error',message:'Profile check error',data:{error:error.message,checkDuration:Date.now()-checkStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        console.error('Error checking profile:', error);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfileExists();
  }, [hasCompletedProfile, setHasCompletedProfile, userInfo]);

  if (isCheckingProfile) {
    return null;
  }

  if (!hasCompletedProfile) {
    return <WelcomeCreateProfileScreen />;
  }

  // ВРЕМЕННО ОТКЛЮЧЕНО: онбординг с целями
  // return <OnboardingMainGoal />;
  
  // Вместо онбординга сразу редиректим на анкеты
  useEffect(() => {
    navigate('/profiles', { replace: true });
  }, [navigate]);
  
  return null; // Пока идет редирект
};

export default Home;

