import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebApp } from '../contexts/WebAppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Autocomplete from '../components/Autocomplete';
import MultiSelect from '../components/MultiSelect';
import { russianCities, universities, interests, goals } from '../data/formData';
import { API_ENDPOINTS, getPhotoUrl } from '../config/api';

const ProfileForm = () => {
  const { userInfo, isReady } = useWebApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    city: '',
    university: '',
    interests: [],
    goals: [],
    customInterest: '',
    customGoal: '',
    bio: '',
    photos: [],
  });

  const [errors, setErrors] = useState({});

  // Загрузка существующего профиля
  useEffect(() => {
    if (!isReady || !userInfo?.id) {
      setLoadingProfile(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const url = API_ENDPOINTS.PROFILE_BY_USER_ID(userInfo.id);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setIsEditing(true);
          
          // Парсим interests и goals
          let parsedInterests = [];
          let parsedGoals = [];
          
          try {
            parsedInterests = Array.isArray(data.interests) 
              ? data.interests 
              : (data.interests ? JSON.parse(data.interests) : []);
          } catch (e) {
            console.warn('Error parsing interests:', e);
          }
          
          try {
            parsedGoals = Array.isArray(data.goals) 
              ? data.goals 
              : (data.goals ? JSON.parse(data.goals) : []);
          } catch (e) {
            console.warn('Error parsing goals:', e);
          }

          // Заполняем форму существующими данными
          setFormData({
            name: data.name || '',
            gender: data.gender || '',
            age: data.age?.toString() || '',
            city: data.city || '',
            university: data.university || '',
            interests: parsedInterests,
            goals: parsedGoals,
            customInterest: '',
            customGoal: '',
            bio: data.bio || '',
            photos: data.photo_url ? [{ 
              preview: getPhotoUrl(data.photo_url), 
              id: 'existing',
              isExisting: true 
            }] : [],
          });
        } else if (response.status === 404) {
          // Профиля нет - это нормально, оставляем форму пустой для создания
          // Не логируем и не показываем ошибку пользователю
          setIsEditing(false);
        } else {
          // Другая ошибка - логируем только в консоль, не показываем пользователю
          console.warn('Unexpected error loading profile:', response.status);
          setIsEditing(false);
        }
      } catch (error) {
        // При ошибке сети оставляем форму пустой, не показываем ошибку
        // Логируем только в консоль для отладки
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading profile:', error);
        }
        setIsEditing(false);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [isReady, userInfo]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length === 0) return;

    const file = files[0];

    if (!allowedTypes.includes(file.type)) {
      alert('Только изображения JPG, PNG или WebP');
      return;
    }
    if (file.size > maxSize) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    // Удаляем предыдущее фото, если есть
    if (formData.photos.length > 0) {
      const oldPhoto = formData.photos[0];
      if (oldPhoto.preview) {
        URL.revokeObjectURL(oldPhoto.preview);
      }
    }

    const newPhoto = {
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    };

    setFormData({
      ...formData,
      photos: [newPhoto],
    });
  };

  const removePhoto = (id) => {
    const photo = formData.photos.find(p => p.id === id);
    if (photo && photo.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    setFormData({
      ...formData,
      photos: formData.photos.filter(p => p.id !== id),
    });
  };

  const addCustomInterest = (customInterest) => {
    if (customInterest && !formData.interests.includes(customInterest)) {
      handleInputChange('interests', [...formData.interests, customInterest]);
    }
  };

  const addCustomGoal = (customGoal) => {
    if (customGoal && !formData.goals.includes(customGoal)) {
      handleInputChange('goals', [...formData.goals, customGoal]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) newErrors.name = 'Введите имя (минимум 2 символа)';
    if (!formData.gender) newErrors.gender = 'Выберите пол';
    if (!formData.age) {
      newErrors.age = 'Укажите возраст';
    } else {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 15 || ageNum > 50) {
        newErrors.age = 'Возраст должен быть от 15 до 50 лет';
      }
    }
    if (!formData.city) newErrors.city = 'Выберите город';
    if (!formData.university) newErrors.university = 'Выберите университет';
    if (formData.interests.length === 0) newErrors.interests = 'Выберите хотя бы один интерес';
    if (formData.goals.length === 0) newErrors.goals = 'Выберите хотя бы одну цель';
    if (formData.bio.length > 200) {
      newErrors.bio = 'Максимум 200 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInfo) {
      alert('Ошибка: данные пользователя не загружены. Пожалуйста, обновите страницу.');
      console.error('userInfo is missing:', userInfo);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('user_id', userInfo.id.toString());
      formDataToSend.append('username', userInfo.username || '');
      formDataToSend.append('first_name', userInfo.first_name || '');
      formDataToSend.append('last_name', userInfo.last_name || '');
      formDataToSend.append('name', formData.name);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('age', formData.age.toString());
      formDataToSend.append('city', formData.city);
      formDataToSend.append('university', formData.university);
      formDataToSend.append('interests', JSON.stringify(formData.interests));
      formDataToSend.append('goals', JSON.stringify(formData.goals));
      formDataToSend.append('bio', formData.bio || '');

      // Отправляем фото только если оно новое (не существующее)
      if (formData.photos.length > 0 && formData.photos[0].file && !formData.photos[0].isExisting) {
        formDataToSend.append('photo', formData.photos[0].file);
      }

      console.log('Sending profile data to:', API_ENDPOINTS.PROFILES);
      console.log('User ID:', userInfo.id);

      const response = await fetch(API_ENDPOINTS.PROFILES, {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile saved successfully:', data);
        alert(isEditing ? 'Профиль успешно обновлён!' : 'Профиль успешно создан!');
        navigate('/');
      } else {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        let errorMessage = 'Ошибка при сохранении профиля';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = `Ошибка ${response.status}: ${errorText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Network error creating profile:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Не удалось подключиться к серверу. Проверьте, что бэкенд запущен и доступен.');
      } else {
        alert(`Ошибка при сохранении профиля: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };


  if (loadingProfile) {
    return (
      <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <Card className="mt-4">
          <p className="text-center text-gray-800 font-medium py-8">Загрузка профиля...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-[320px] min-h-[600px] max-w-2xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <Card className="mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {isEditing ? 'Редактировать профиль' : 'Добавить мой профиль'}
        </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Имя */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Введите ваше имя"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? 'border-red-300' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Пол */}
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пол <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.gender ? 'border-red-300' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm`}
            >
              <option value="">Выберите пол</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
          </div>

          {/* Возраст */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Возраст <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Введите ваш возраст"
              min="15"
              max="50"
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.age ? 'border-red-300' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm`}
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
          </div>

          {/* Город */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город <span className="text-red-500">*</span>
            </label>
            <Autocomplete
              options={russianCities}
              value={formData.city}
              onChange={(value) => handleInputChange('city', value)}
              placeholder="Введите название города..."
              className={errors.city ? 'border-red-300' : ''}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* Университет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Университет <span className="text-red-500">*</span>
            </label>
            <Autocomplete
              options={universities}
              value={formData.university}
              onChange={(value) => handleInputChange('university', value)}
              placeholder="Введите название университета..."
              className={errors.university ? 'border-red-300' : ''}
            />
            {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university}</p>}
          </div>

          {/* Интересы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Интересы <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={interests}
              selected={formData.interests}
              onChange={(selected) => handleInputChange('interests', selected)}
              placeholder="Выберите интересы..."
              onAddCustom={addCustomInterest}
              className={errors.interests ? 'border-red-300' : ''}
            />
            {errors.interests && <p className="text-red-500 text-xs mt-1">{errors.interests}</p>}
          </div>

          {/* Цель поиска */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цель поиска <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={goals}
              selected={formData.goals}
              onChange={(selected) => handleInputChange('goals', selected)}
              placeholder="Выберите цели..."
              onAddCustom={addCustomGoal}
              className={errors.goals ? 'border-red-300' : ''}
            />
            {errors.goals && <p className="text-red-500 text-xs mt-1">{errors.goals}</p>}
          </div>

          {/* Информация о себе */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Информация о себе
            </label>
            <textarea
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.bio ? 'border-red-300' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm`}
              rows="5"
              placeholder="Расскажите о себе (до 200 символов)..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              maxLength={200}
            />
            <div className="flex justify-end items-center mt-1">
              {errors.bio && (
                <p className="text-red-500 text-xs mr-2">{errors.bio}</p>
              )}
              <p className="text-gray-400 text-xs">{formData.bio.length}/200</p>
            </div>
          </div>

          {/* Загрузка фотографий */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фотография
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-500 transition-colors text-sm text-gray-600"
            >
              {formData.photos.length > 0 ? 'Заменить фото' : '+ Загрузить фото'}
            </button>
            {formData.photos.length > 0 && (
              <div className="mt-3">
                <div className="relative max-w-xs mx-auto">
                  <img
                    src={formData.photos[0].preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                    onError={(e) => {
                      console.error('Error loading image:', formData.photos[0].preview);
                      e.target.style.display = 'none';
                      e.target.nextElementSibling?.style?.display === 'none' && 
                        (e.target.nextElementSibling.style.display = 'block');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(formData.photos[0].id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg hover:bg-red-600 shadow-lg"
                  >
                    ×
                  </button>
                  {formData.photos[0].isExisting && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      Текущее фото
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="flex-1">
              {loading ? 'Сохранение...' : isEditing ? 'Обновить профиль' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileForm;
