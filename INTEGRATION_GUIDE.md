# Инструкция по интеграции Frontend и Backend

## 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
REACT_APP_API_BASE_URL=https://your-backend.com
```

Или для разработки:
```env
REACT_APP_API_BASE_URL=http://localhost:8080
```

## 2. Создание конфигурации API

Создайте файл `src/config/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  PROFILES: `${API_BASE_URL}/api/profiles`,
  PROFILE_BY_ID: (id) => `${API_BASE_URL}/api/profiles/${id}`,
  LIKE_PROFILE: (id) => `${API_BASE_URL}/api/profiles/${id}/like`,
  PASS_PROFILE: (id) => `${API_BASE_URL}/api/profiles/${id}/pass`,
  MATCHES: `${API_BASE_URL}/api/matches`,
};

export default API_BASE_URL;
```

## 3. Обновление ProfileForm.jsx

Замените URL в `src/pages/ProfileForm.jsx`:

```javascript
import { API_ENDPOINTS } from '../config/api';

// В функции handleSubmit:
const response = await fetch(API_ENDPOINTS.PROFILES, {
  method: 'POST',
  body: formDataToSend,
});
```

## 4. Обновление Profiles.jsx

Добавьте загрузку профилей с бэкенда:

```javascript
import { API_ENDPOINTS } from '../config/api';
import { useWebApp } from '../contexts/WebAppContext';

// В компоненте Profiles:
const { userInfo } = useWebApp();
const [allProfiles, setAllProfiles] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProfiles = async () => {
    if (!userInfo?.id) return;
    
    try {
      const params = new URLSearchParams({
        userId: userInfo.id,
        ...(selectedCity && { city: selectedCity }),
        ...(selectedUniversity && { university: selectedUniversity }),
        ...(selectedInterests.length > 0 && { interests: selectedInterests.join(',') }),
        page: 0,
        size: 50
      });
      
      const response = await fetch(`${API_ENDPOINTS.PROFILES}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAllProfiles(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchProfiles();
}, [userInfo, selectedCity, selectedUniversity, selectedInterests]);
```

## 5. Обновление обработчиков лайка/пропуска

В `src/pages/Profiles.jsx`:

```javascript
const handleLike = async () => {
  if (!currentProfile || !userInfo) return;
  
  try {
    const response = await fetch(API_ENDPOINTS.LIKE_PROFILE(currentProfile.id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userInfo.id }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.matched) {
        addMatch(currentProfile);
        alert('Вы замэтчились!');
      }
      // Переход к следующему профилю
      handleNextProfile();
    }
  } catch (error) {
    console.error('Error liking profile:', error);
    alert('Ошибка при отправке лайка');
  }
};

const handlePass = async () => {
  if (!currentProfile || !userInfo) return;
  
  try {
    await fetch(API_ENDPOINTS.PASS_PROFILE(currentProfile.id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userInfo.id }),
    });
    
    handleNextProfile();
  } catch (error) {
    console.error('Error passing profile:', error);
  }
};
```

## 6. Обновление NetworkList.jsx

```javascript
import { API_ENDPOINTS } from '../config/api';
import { useWebApp } from '../contexts/WebAppContext';

const { userInfo } = useWebApp();
const [matchedProfiles, setMatchedProfiles] = useState([]);

useEffect(() => {
  const fetchMatches = async () => {
    if (!userInfo?.id) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.MATCHES}?userId=${userInfo.id}`);
      if (response.ok) {
        const data = await response.json();
        setMatchedProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };
  
  fetchMatches();
}, [userInfo]);
```

## 7. Обновление UserCard.jsx

```javascript
import { API_ENDPOINTS } from '../config/api';
import { useWebApp } from '../contexts/WebAppContext';

const { id } = useParams();
const { userInfo } = useWebApp();
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROFILE_BY_ID(id));
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchProfile();
}, [id]);

const handleMatch = async () => {
  if (!userInfo) return;
  
  try {
    const response = await fetch(API_ENDPOINTS.LIKE_PROFILE(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userInfo.id }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.matched) {
        setIsMatched(true);
      }
    }
  } catch (error) {
    console.error('Error matching:', error);
  }
};
```

## 8. Настройка CORS на Backend

В Spring Boot добавьте конфигурацию CORS:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:3000", "https://your-frontend-domain.com")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

## 9. Проверка подключения

1. Запустите backend на `http://localhost:8080`
2. Запустите frontend: `npm start`
3. Откройте DevTools → Network
4. Проверьте, что запросы идут на правильный URL
5. Проверьте ответы от backend

## 10. Обработка ошибок

Создайте утилиту для обработки ошибок `src/utils/api.js`:

```javascript
export const handleApiError = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};
```

Используйте в запросах:
```javascript
const data = await handleApiError(response);
```

## 11. Production настройки

1. Убедитесь, что `REACT_APP_API_BASE_URL` указывает на production backend
2. Проверьте, что backend имеет HTTPS
3. Настройте CORS для production домена
4. Проверьте работу всех endpoints

