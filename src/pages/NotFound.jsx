import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6 flex items-center justify-center" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <Card className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-gray-800 mb-4 font-medium">Страница не найдена</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          На главную
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;

