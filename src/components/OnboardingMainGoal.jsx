import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import { MainGoal, MAIN_GOAL_LABELS, MAIN_GOAL_DESCRIPTIONS, REDIRECT_AFTER_GOAL } from '../types/onboarding';
import Card from './Card';

const OnboardingMainGoal = () => {
  const navigate = useNavigate();
  const { setMainGoal, setHasCompletedOnboarding } = useWebApp();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goals = [
    MainGoal.SOCIAL_CIRCLE,
    MainGoal.STUDY_WORK_BUDDIES,
    MainGoal.HACKATHON_TEAM,
    MainGoal.SKILL_EXCHANGE,
  ];

  const handleGoalSelect = (goal) => {
    setMainGoal(goal);
    setHasCompletedOnboarding(true);
    navigate(REDIRECT_AFTER_GOAL[goal]);
  };

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6 flex flex-col justify-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-6 md:space-y-8">
        <Card className="bg-white/30 backdrop-blur-xl border-2 border-white/50 shadow-2xl">
          <div className="relative p-4 md:p-5">
            <div className="absolute -top-3 -left-3 w-24 h-24 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl -z-10"></div>
            <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl -z-10"></div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center leading-tight relative z-10 mb-2" style={{ fontFamily: "'La Bamba', cursive" }}>
              Зачем ты здесь?
            </h1>
            <p className="text-sm md:text-base text-gray-700 text-center relative z-10">
              Выбери главную цель — подберём самые релевантные знакомства.
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          {goals.map((goal, index) => (
            <motion.div
              key={goal}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => handleGoalSelect(goal)}
                className="w-full"
              >
                <Card className="bg-white/20 backdrop-blur-xl border-2 border-white/40 shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-cyan-400/0 to-emerald-400/0 group-hover:from-teal-400/10 group-hover:via-cyan-400/10 group-hover:to-emerald-400/10 transition-all duration-300"></div>
                  <div className="relative p-4 md:p-5">
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 text-left">
                      {MAIN_GOAL_LABELS[goal]}
                    </h3>
                    <p className="text-sm text-gray-600 text-left">
                      {MAIN_GOAL_DESCRIPTIONS[goal]}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 shadow-lg shadow-teal-400/50"></div>
                    </div>
                  </div>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingMainGoal;


