# Техническое задание для Backend (Java)

## Обзор проекта

React-приложение для студенческого нетворкинга, интегрированное с MAX Platform. Backend должен предоставлять REST API для управления профилями пользователей, системой мэтчинга и фильтрации.

## Технологический стек

- **Backend**: Java (Spring Boot рекомендуется)
- **База данных**: PostgreSQL/MySQL
- **Файловое хранилище**: Локальное или S3-совместимое хранилище для фотографий
- **API**: REST API с JSON и multipart/form-data

---

## API Endpoints

### 1. Создание/Обновление профиля

**POST** `/api/profiles`

**Content-Type**: `multipart/form-data`

**Параметры запроса:**
```
userId: Long (обязательно) - ID пользователя из MAX Platform
username: String (опционально) - username из MAX
firstName: String (опционально) - имя из MAX
lastName: String (опционально) - фамилия из MAX
name: String (обязательно, минимум 2 символа) - имя для анкеты
gender: String (обязательно) - "male" | "female" | "other"
age: Integer (обязательно) - возраст (16-35)
city: String (обязательно) - город
university: String (обязательно) - название университета
interests: String (JSON массив) - ["IT", "Дизайн", ...]
goals: String (JSON массив) - ["Совместная учёба", "Хакатон", ...]
bio: String (опционально, максимум 400 символов) - описание о себе
photo: File (опционально) - одно изображение (JPG, PNG, WebP, макс. 5MB)
```

**Ответ (200 OK):**
```json
{
  "id": 1,
  "userId": 123456,
  "name": "Алексей",
  "gender": "male",
  "age": 22,
  "city": "Москва",
  "university": "МГУ им. М.В. Ломоносова",
  "interests": ["IT", "Программирование", "Стартапы"],
  "goals": ["Совместная учёба", "Найти команду для хакатона"],
  "bio": "Студент, увлекаюсь разработкой...",
  "photoUrl": "https://your-backend/storage/photos/user_123456.jpg",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Ошибки:**
- `400 Bad Request` - невалидные данные
- `401 Unauthorized` - не авторизован
- `500 Internal Server Error` - ошибка сервера

---

### 2. Получение списка профилей (для свайпов)

**GET** `/api/profiles`

**Query параметры:**
```
userId: Long (обязательно) - ID текущего пользователя
city: String (опционально) - фильтр по городу
university: String (опционально) - фильтр по университету
interests: String (опционально, через запятую) - фильтр по интересам
page: Integer (опционально, по умолчанию 0) - номер страницы
size: Integer (опционально, по умолчанию 20) - размер страницы
```

**Логика:**
- Не возвращать профиль текущего пользователя
- Не возвращать уже просмотренные профили (swiped)
- Не возвращать уже замэтченные профили
- Применять фильтры если указаны

**Ответ (200 OK):**
```json
{
  "content": [
    {
      "id": 2,
      "name": "Мария",
      "age": 21,
      "city": "Санкт-Петербург",
      "university": "СПбГУ",
      "interests": ["Дизайн", "Фотография", "Искусство"],
      "goals": ["Совместные активности", "Друзья по интересам"],
      "bio": "Дизайнер, увлекаюсь фотографией...",
      "photoUrl": "https://your-backend/storage/photos/user_789012.jpg"
    }
  ],
  "totalElements": 15,
  "totalPages": 1,
  "page": 0,
  "size": 20
}
```

---

### 3. Получение конкретного профиля

**GET** `/api/profiles/{profileId}`

**Ответ (200 OK):**
```json
{
  "id": 2,
  "userId": 789012,
  "name": "Мария",
  "gender": "female",
  "age": 21,
  "city": "Санкт-Петербург",
  "university": "СПбГУ",
  "interests": ["Дизайн", "Фотография", "Искусство"],
  "goals": ["Совместные активности", "Друзья по интересам"],
  "bio": "Дизайнер, увлекаюсь фотографией и искусством...",
  "photoUrl": "https://your-backend/storage/photos/user_789012.jpg",
  "createdAt": "2025-01-14T15:20:00Z"
}
```

**Ошибки:**
- `404 Not Found` - профиль не найден

---

### 4. Лайк профиля

**POST** `/api/profiles/{profileId}/like`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "userId": 123456
}
```

**Логика:**
- Сохранить действие "лайк" в БД
- Проверить взаимный лайк (если второй пользователь тоже лайкнул первого)
- Если взаимный лайк - создать мэтч

**Ответ (200 OK):**
```json
{
  "matched": true,
  "matchId": 42,
  "message": "Вы замэтчились!"
}
```

или

```json
{
  "matched": false,
  "message": "Лайк отправлен"
}
```

---

### 5. Пропуск профиля

**POST** `/api/profiles/{profileId}/pass`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "userId": 123456
}
```

**Ответ (200 OK):**
```json
{
  "success": true,
  "message": "Профиль пропущен"
}
```

---

### 6. Получение списка мэтчей

**GET** `/api/matches?userId={userId}`

**Ответ (200 OK):**
```json
[
  {
    "id": 42,
    "matchedProfile": {
      "id": 2,
      "name": "Мария",
      "age": 21,
      "city": "Санкт-Петербург",
      "university": "СПбГУ",
      "bio": "Дизайнер, увлекаюсь фотографией...",
      "photoUrl": "https://your-backend/storage/photos/user_789012.jpg"
    },
    "matchedAt": "2025-01-15T12:00:00Z"
  }
]
```

---

## Структура базы данных

### Таблица: `profiles`
```sql
CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    age INTEGER NOT NULL,
    city VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
    interests TEXT, -- JSON массив
    goals TEXT, -- JSON массив
    bio TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_university ON profiles(university);
```

### Таблица: `swipes`
```sql
CREATE TABLE swipes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_profile_id BIGINT NOT NULL,
    action VARCHAR(10) NOT NULL, -- 'like' | 'pass'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_profile_id),
    FOREIGN KEY (target_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_swipes_user_id ON swipes(user_id);
CREATE INDEX idx_swipes_target_profile_id ON swipes(target_profile_id);
```

### Таблица: `matches`
```sql
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id BIGINT NOT NULL,
    user2_id BIGINT NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
```

---

## Валидация данных

### Профиль:
- `name`: обязательное, минимум 2 символа, максимум 100
- `gender`: обязательное, одно из: "male", "female", "other"
- `age`: обязательное, от 16 до 35
- `city`: обязательное, не пустое
- `university`: обязательное, не пустое
- `interests`: массив строк, минимум 1 элемент
- `goals`: массив строк, минимум 1 элемент
- `bio`: опциональное, максимум 400 символов
- `photo`: опциональное, только JPG/PNG/WebP, максимум 5MB

### Фото:
- Форматы: image/jpeg, image/png, image/webp
- Максимальный размер: 5MB
- Рекомендуется ресайз до 800x800px для оптимизации

---

## Безопасность

1. **Аутентификация**: 
   - Использовать `userId` из MAX Platform как идентификатор
   - В production добавить JWT токены или OAuth2

2. **Валидация**:
   - Проверять все входящие данные
   - Санитизировать строки от XSS

3. **CORS**:
   - Настроить CORS для домена фронтенда
   - Разрешить методы: GET, POST, PUT, DELETE
   - Разрешить заголовки: Content-Type, Authorization

4. **Файлы**:
   - Валидировать MIME-типы
   - Ограничить размер файлов
   - Сохранять файлы вне webroot или с ограниченным доступом

---

## Примеры запросов

### Создание профиля (cURL):
```bash
curl -X POST https://your-backend/api/profiles \
  -F "userId=123456" \
  -F "name=Алексей" \
  -F "gender=male" \
  -F "age=22" \
  -F "city=Москва" \
  -F "university=МГУ им. М.В. Ломоносова" \
  -F "interests=[\"IT\",\"Программирование\"]" \
  -F "goals=[\"Совместная учёба\"]" \
  -F "bio=Студент, увлекаюсь разработкой" \
  -F "photo=@/path/to/photo.jpg"
```

### Получение профилей:
```bash
curl "https://your-backend/api/profiles?userId=123456&city=Москва&page=0&size=20"
```

### Лайк профиля:
```bash
curl -X POST https://your-backend/api/profiles/2/like \
  -H "Content-Type: application/json" \
  -d '{"userId": 123456}'
```

---

## Рекомендации по реализации

1. **Spring Boot**:
   - Использовать Spring Data JPA для работы с БД
   - Spring Boot Starter Web для REST API
   - Spring Boot Starter Validation для валидации
   - MultipartFile для загрузки файлов

2. **Файловое хранилище**:
   - Локальное: `FileSystemStorageService`
   - Облачное: AWS S3, MinIO, или аналоги

3. **Пагинация**:
   - Использовать Spring Data Pageable

4. **Обработка ошибок**:
   - Глобальный ExceptionHandler
   - Стандартизированные ответы об ошибках

---

## Тестирование

Backend должен быть протестирован:
- Unit тесты для сервисов
- Integration тесты для API endpoints
- Тесты валидации данных
- Тесты загрузки файлов

---

## Дополнительные требования

1. **Логирование**: Логировать все важные операции
2. **Мониторинг**: Метрики для отслеживания производительности
3. **Резервное копирование**: Регулярные бэкапы БД
4. **Масштабируемость**: Учесть возможность горизонтального масштабирования

