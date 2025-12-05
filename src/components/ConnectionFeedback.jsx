import { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { API_ENDPOINTS } from '../config/api';

const FEEDBACK_TYPES = {
  HELPED_ME: { label: 'Мне помогли с навыком/задачей', icon: '🤝' },
  I_HELPED: { label: 'Я помог', icon: '💪' },
  PROJECT_TOGETHER: { label: 'Сделали проект / участвовали в хакатоне', icon: '🚀' },
  EVENT_TOGETHER: { label: 'Сходили на событие/ивент', icon: '🎉' },
};

const ConnectionFeedback = ({ matchId, fromUserId, toUserId, onClose }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [existingFeedbacks, setExistingFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadExistingFeedbacks();
  }, [matchId, fromUserId]);

  const loadExistingFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.CONNECTION_FEEDBACK_MATCH(matchId)}?user_id=${fromUserId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingFeedbacks(data.map(f => f.feedback_type));
        setSelectedTypes(data.map(f => f.feedback_type));
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

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const newTypes = selectedTypes.filter(t => !existingFeedbacks.includes(t));
      
      for (const type of newTypes) {
        await fetch(API_ENDPOINTS.CONNECTION_FEEDBACK, {
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
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Ошибка при сохранении отметок');
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
    <Card>
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Чем было полезно это знакомство?
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Отметьте, что произошло в результате этого коннекта
      </p>
      
      <div className="space-y-2 mb-4">
        {Object.entries(FEEDBACK_TYPES).map(([type, info]) => {
          const isSelected = selectedTypes.includes(type);
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
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting || selectedTypes.length === 0 || selectedTypes.every(t => existingFeedbacks.includes(t))}
          className="flex-1"
        >
          {submitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ConnectionFeedback;

