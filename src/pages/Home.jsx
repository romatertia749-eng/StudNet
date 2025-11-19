import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import Button from '../components/Button';
import Card from '../components/Card';

const Home = () => {
  const { userInfo } = useWebApp();
  const navigate = useNavigate();

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6 flex flex-col justify-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <div className="space-y-4">
        <Card className="-mt-20 md:-mt-24">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Студенческий нетворкинг
          </h1>
          <p className="text-sm text-gray-800 font-medium">
            Находите единомышленников, создавайте команды для проектов и расширяйте свой круг общения.
          </p>
        </Card>

        {userInfo && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Привет, {userInfo.first_name || userInfo.username}!
            </h2>
          </Card>
        )}

        <div className="space-y-6 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
          <Button
            variant="primary"
            onClick={() => navigate('/profile/edit')}
          >
            Создать/Редактировать анкету
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/profiles')}
          >
            Анкеты
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/network')}
          >
            Нет-Лист
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;

