import { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { API_ENDPOINTS } from '../config/api';

const FEEDBACK_TYPES = {
  HELPED_ME: { label: 'Мне помогли с навыком/задачей', icon: '🤝' },
  I_HELPED: { label: 'Я помог', icon: '💪' },
  PROJECT_TOGETHER: { label: 'Сделали проект / участвовали в хакатоне', icon: '🚀' },
  EVENT_TOGETHER: { label: 'Выбрались прогуляться или на мероприятие', icon: '🎉' },
};

const SuccessNotification = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full pointer-events-auto animate-scale-in"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 250, 0.95))',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(0, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 255, 255, 0.3), 0 0 40px rgba(54, 207, 255, 0.2)',
          animation: 'scaleIn 0.3s ease-out',
        }}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(54, 207, 255, 0.4))',
              boxShadow: '0 10px 30px rgba(0, 255, 255, 0.4)',
            }}
          >
            <span className="text-4xl">✨</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Отметка сохранена!
          </h3>
          <p className="text-sm text-gray-600">
            Спасибо за обратную связь
          </p>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

const ConnectionFeedback = ({ matchId, fromUserId, toUserId, onClose }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [existingFeedbacks, setExistingFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadExistingFeedbacks();
  }, [matchId, fromUserId]);

  const loadExistingFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.CONNECTION_FEEDBACK_MATCH(matchId)}?user_id=${fromUserId}`);
      if (response.ok) {
        const data = await response.json();
        const existing = data.map(f => f.feedback_type);
        setExistingFeedbacks(existing);
        // Убираем из selectedTypes те, что уже отправлены
        setSelectedTypes(prev => prev.filter(t => !existing.includes(t)));
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (type) => {
    if (existingFeedbacks.includes(type)) {
      return;
    }
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Фильтруем только те типы, которых еще нет в existingFeedbacks
    const newTypes = selectedTypes.filter(t => !existingFeedbacks.includes(t));
    
    console.log('handleSubmit called', { selectedTypes, existingFeedbacks, newTypes });
    
    if (newTypes.length === 0) {
      console.log('No new types to submit');
      return;
    }

    setSubmitting(true);
    console.log('Submitting feedbacks:', newTypes);
    try {
      const successfulTypes = [];
      const errors = [];
      
      for (const type of newTypes) {
        try {
          const url = API_ENDPOINTS.CONNECTION_FEEDBACK.endsWith('/') 
            ? API_ENDPOINTS.CONNECTION_FEEDBACK 
            : API_ENDPOINTS.CONNECTION_FEEDBACK;
          
          console.log('Sending POST to:', url, { match_id: matchId, from_user_id: fromUserId, to_user_id: toUserId, feedback_type: type });
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              match_id: matchId,
              from_user_id: fromUserId,
              to_user_id: toUserId,
              feedback_type: type,
            }),
          });
          
          console.log('Response status:', response.status, response.statusText);
          
          if (response.ok) {
            successfulTypes.push(type);
          } else {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { detail: errorText || `HTTP ${response.status}: ${response.statusText}` };
            }
            errors.push({ type, error: errorData.detail || `HTTP ${response.status}` });
            console.error(`Failed to submit ${type}:`, errorData, 'Response:', errorText);
          }
        } catch (err) {
          errors.push({ type, error: err.message });
          console.error(`Error submitting ${type}:`, err);
        }
      }

      if (successfulTypes.length > 0) {
        // Обновляем список существующих отметок, добавляя успешно отправленные
        setExistingFeedbacks(prev => [...prev, ...successfulTypes]);
        // Убираем отправленные типы из выбранных (они теперь в existingFeedbacks)
        setSelectedTypes(prev => prev.filter(t => !successfulTypes.includes(t)));
        
        // Показываем уведомление
        setShowSuccess(true);
        
        // Перезагружаем список отметок для синхронизации
        await loadExistingFeedbacks();
      }
      
      if (errors.length > 0 && successfulTypes.length === 0) {
        alert(`Ошибка при сохранении отметок: ${errors.map(e => e.error).join(', ')}`);
      } else if (errors.length > 0) {
        console.warn('Some feedbacks failed to submit:', errors);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Ошибка при сохранении отметок: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-center text-gray-800">Загрузка...</p>
      </Card>
    );
  }

  return (
    <>
      {showSuccess && (
        <SuccessNotification onClose={() => setShowSuccess(false)} />
      )}
      <Card>
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Чем было полезно это знакомство?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Отметьте, что произошло в результате этого коннекта
        </p>
        
        <div className="space-y-2 mb-4">
          {Object.entries(FEEDBACK_TYPES).map(([type, info]) => {
            const isSelected = selectedTypes.includes(type) && !existingFeedbacks.includes(type);
            const isExisting = existingFeedbacks.includes(type);
            
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                disabled={isExisting}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-white/40 backdrop-blur-md border-teal-300 text-gray-800'
                    : isExisting
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white/20 backdrop-blur-md border-white/40 text-gray-700 hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.icon}</span>
                  <span className="flex-1 text-sm font-medium">{info.label}</span>
                  {isExisting && (
                    <span className="text-xs text-gray-500">(уже отмечено)</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || selectedTypes.length === 0 || selectedTypes.every(t => existingFeedbacks.includes(t))}
            className="flex-1"
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              style={{
                background: 'white',
                borderColor: 'rgb(229, 231, 235)',
                color: 'rgb(31, 41, 55)',
              }}
            >
              Отмена
            </Button>
          )}
        </div>
      </Card>
    </>
  );
};

export default ConnectionFeedback;

