# Полное описание проекта StudNet (Max Networking App)

## Общая информация

**Название проекта:** StudNet (Max Networking App)  
**Тип приложения:** Telegram Web App для нетворкинга студентов  
**Текущая версия:** 0.1.0  
**Статус:** В разработке, функциональный прототип

## Архитектура проекта

Проект представляет собой полнофункциональное приложение для нетворкинга студентов, работающее как Telegram Mini App. Приложение состоит из двух основных частей:

1. **Frontend** - React-приложение с мобильным-first дизайном
2. **Backend** - FastAPI REST API на Python

### Технологический стек

#### Frontend
- **React 19.2.0** - основной фреймворк
- **React Router DOM 7.9.5** - маршрутизация
- **Tailwind CSS 3.4.18** - стилизация
- **Framer Motion 12.23.24** - анимации
- **Lucide React 0.555.0** - иконки
- **Telegram Web App SDK** - интеграция с Telegram

#### Backend
- **FastAPI 0.115.0** - веб-фреймворк
- **SQLAlchemy 2.0.36** - ORM
- **PostgreSQL** - база данных
- **Pydantic 2.10.0** - валидация данных
- **PyJWT 2.8.0** - JWT токены
- **ImageKit.io 3.2.0** - хранение изображений
- **Pillow 10.0.0** - обработка изображений
- **Uvicorn** - ASGI сервер

## Структура проекта

```
max-networking-app/
├── src/                          # React приложение
│   ├── components/              # Переиспользуемые компоненты
│   │   ├── Autocomplete.jsx    # Автодополнение для городов/университетов
│   │   ├── BottomNav.jsx        # Нижняя навигация
│   │   ├── Button.jsx           # Кнопка с вариантами стилей
│   │   ├── Card.jsx             # Карточка контента
│   │   ├── EffectOverlay.jsx   # Анимация свайпа (лайк/пасс)
│   │   ├── Header.jsx           # Верхний заголовок
│   │   ├── HeaderConnectsBadge.jsx # Бейдж с количеством контактов
│   │   ├── Loader.jsx           # Индикатор загрузки
│   │   ├── MultiSelect.jsx      # Множественный выбор
│   │   ├── OnboardingMainGoal.jsx # Экран выбора главной цели
│   │   └── WelcomeCreateProfileScreen.jsx # Приветственный экран
│   ├── pages/                   # Страницы приложения
│   │   ├── Home.jsx             # Главная страница
│   │   ├── NetworkList.jsx      # Список мэтчей (Net-Лист)
│   │   ├── NotFound.jsx         # 404 страница
│   │   ├── ProfileForm.jsx      # Форма создания/редактирования профиля
│   │   ├── Profiles.jsx         # Страница просмотра профилей (свайп)
│   │   └── UserCard.jsx         # Детальная карточка пользователя
│   ├── contexts/                # React контексты
│   │   ├── MatchContext.js      # Контекст для мэтчей
│   │   └── WebAppContext.js     # Контекст Telegram Web App
│   ├── config/                  # Конфигурация
│   │   └── api.js               # API endpoints и утилиты
│   ├── data/                    # Статические данные
│   │   └── formData.js          # Списки городов, университетов, интересов
│   ├── utils/                   # Утилиты
│   │   ├── api.js               # Функции для работы с API
│   │   └── connectTitles.js     # Заголовки для контактов
│   ├── types/                   # TypeScript типы (если используется)
│   │   └── onboarding.js       # Типы для онбординга
│   ├── App.jsx                  # Главный компонент приложения
│   ├── index.js                 # Точка входа
│   └── index.css                # Глобальные стили
├── backend_python/              # FastAPI бэкенд
│   ├── app/
│   │   ├── main.py              # Точка входа FastAPI
│   │   ├── database.py          # Настройка БД (SQLAlchemy)
│   │   ├── models.py            # SQLAlchemy модели
│   │   ├── schemas.py           # Pydantic схемы
│   │   ├── auth.py              # Авторизация через Telegram
│   │   ├── dependencies.py      # Зависимости FastAPI
│   │   ├── routers/             # API роутеры
│   │   │   ├── auth.py          # Роуты авторизации
│   │   │   ├── profiles.py      # Роуты профилей
│   │   │   └── matches.py       # Роуты мэтчей
│   │   └── services/            # Бизнес-логика
│   │       ├── profile_service.py # Сервис профилей
│   │       ├── match_service.py   # Сервис мэтчей
│   │       └── file_storage.py    # Загрузка файлов в ImageKit
│   ├── requirements.txt         # Python зависимости
│   ├── env.example              # Пример переменных окружения
│   ├── Procfile                 # Конфигурация для деплоя
│   └── render.yaml              # Конфигурация для Render.com
├── database/
│   └── schema.sql               # SQL схема базы данных
├── public/                      # Статические файлы
│   └── assets/                  # Изображения, видео, шрифты
├── package.json                 # Node.js зависимости
├── tailwind.config.js           # Конфигурация Tailwind
└── README.md                    # Документация проекта
```

## Функциональность

### Основные возможности

1. **Авторизация через Telegram**
   - Автоматическая авторизация через Telegram Web App SDK
   - Валидация initData на бэкенде
   - Генерация JWT токенов
   - Сохранение состояния пользователя

2. **Создание и редактирование профиля**
   - Заполнение личной информации (имя, возраст, пол)
   - Выбор города из списка российских городов
   - Выбор университета из списка (300+ университетов)
   - Выбор интересов (множественный выбор)
   - Выбор целей нетворкинга
   - Загрузка фотографии профиля (ImageKit)
   - Описание (bio) до 300 символов

3. **Просмотр профилей (Swipe-интерфейс)**
   - Карточки пользователей с информацией
   - Swipe влево (пасс) / вправо (лайк)
   - Фильтрация по городу, университету, интересам
   - Две вкладки: "Все" и "Входящие лайки"
   - Анимации свайпа через Framer Motion
   - Защита от повторных свайпов

4. **Система мэтчинга**
   - Автоматическое создание мэтча при взаимном лайке
   - Отображение мэтчей в разделе "Net-Лист"
   - Счетчик контактов в хедере
   - Возможность написать пользователю через Telegram

5. **Net-Лист (список мэтчей)**
   - Отображение всех мэтчей пользователя
   - Карточки с информацией о мэтче
   - Переход к профилю пользователя
   - Кнопка для связи через Telegram

### Дополнительные функции

- **Онбординг** - выбор главной цели использования приложения
- **Фильтры** - поиск по городу, университету, интересам
- **Адаптивный дизайн** - мобильный-first, работает на всех устройствах
- **Оптимизация изображений** - автоматическая оптимизация перед загрузкой
- **Офлайн-режим** - сохранение состояния в localStorage

## База данных

### Таблицы

#### 1. `profiles` - Профили пользователей
```sql
- id (BIGSERIAL, PRIMARY KEY)
- user_id (BIGINT, UNIQUE, NOT NULL) - Telegram user ID
- username (VARCHAR(255))
- first_name (VARCHAR(255))
- last_name (VARCHAR(255))
- name (VARCHAR(255), NOT NULL)
- gender (VARCHAR(20), NOT NULL) - 'male', 'female', 'other'
- age (INTEGER, NOT NULL) - от 15 до 50
- city (VARCHAR(255), NOT NULL, INDEXED)
- university (VARCHAR(255), NOT NULL, INDEXED)
- interests (TEXT) - JSON массив
- goals (TEXT) - JSON массив
- bio (TEXT) - до 300 символов
- photo_url (VARCHAR(500)) - URL изображения в ImageKit
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `swipes` - История свайпов
```sql
- id (BIGSERIAL, PRIMARY KEY)
- user_id (BIGINT, NOT NULL, INDEXED) - кто сделал свайп
- target_profile_id (BIGINT, NOT NULL, INDEXED, FK) - на кого свайпнули
- action (VARCHAR(10), NOT NULL) - 'like' или 'pass'
- created_at (TIMESTAMP, INDEXED)
- UNIQUE(user_id, target_profile_id)
```

#### 3. `matches` - Мэтчи (взаимные лайки)
```sql
- id (BIGSERIAL, PRIMARY KEY)
- user1_id (BIGINT, NOT NULL, INDEXED, FK) - всегда меньше user2_id
- user2_id (BIGINT, NOT NULL, INDEXED, FK) - всегда больше user1_id
- matched_at (TIMESTAMP, INDEXED)
- UNIQUE(user1_id, user2_id)
- CHECK (user1_id < user2_id)
```

### Индексы

Все таблицы имеют индексы на часто используемых полях для оптимизации запросов:
- `profiles`: user_id, city, university, gender, age
- `swipes`: user_id, target_profile_id, action, created_at
- `matches`: user1_id, user2_id, matched_at

## API Endpoints

### Авторизация
- `POST /api/auth` - авторизация через Telegram initData
  - Headers: `Authorization: tma <initData>`
  - Response: `{ token, user_id, user }`

### Профили
- `GET /api/profiles?user_id={id}&city={city}&university={univ}&page={page}&size={size}` - получить список профилей
- `POST /api/profiles` или `POST /api/profiles/` - создать/обновить профиль
  - Body: FormData с полями: user_id, name, gender, age, city, university, interests (JSON), goals (JSON), bio, photo (file)
- `GET /api/profiles/{id}` - получить профиль по ID
- `GET /api/profiles/user/{user_id}` - получить профиль по user_id
- `GET /api/profiles/check/{user_id}` - проверить наличие профиля
- `GET /api/profiles/incoming-likes?user_id={id}&page={page}&size={size}` - получить входящие лайки

### Взаимодействие
- `POST /api/profiles/{id}/like` - лайкнуть профиль
  - Body: `{ user_id }`
  - Response: `{ matched: bool, match_id: int?, message: string }`
- `POST /api/profiles/{id}/pass` - пропустить профиль
  - Body: `{ user_id }`

### Мэтчи
- `GET /api/matches?user_id={id}` - получить список мэтчей
  - Response: `[{ id, matched_profile, matched_at }]`

## Архитектура Frontend

### Компоненты

#### App.jsx
Главный компонент приложения:
- Настройка роутинга (React Router)
- Предзагрузка фонового изображения
- Обработка состояния загрузки
- Структура layout (Header, Main, BottomNav)

#### Страницы

**Home.jsx** - Главная страница
- Приветственный экран
- Проверка наличия профиля
- Редирект на создание профиля или просмотр

**ProfileForm.jsx** - Форма профиля
- Создание нового профиля
- Редактирование существующего
- Загрузка фотографии
- Валидация полей
- Многошаговая форма с сохранением состояния

**Profiles.jsx** - Просмотр профилей
- Swipe-интерфейс с карточками
- Две вкладки: "Все" и "Входящие лайки"
- Фильтры по городу, университету, интересам
- Анимации свайпа через Framer Motion
- Обработка touch-событий
- Защита от повторных свайпов

**UserCard.jsx** - Детальная карточка
- Полная информация о пользователе
- Просмотр фотографий
- Кнопка для связи

**NetworkList.jsx** - Список мэтчей
- Отображение всех мэтчей
- Карточки с информацией
- Переход к профилю
- Кнопка для связи через Telegram

### Контексты

#### WebAppContext
Управление состоянием Telegram Web App:
- `userInfo` - данные пользователя из Telegram
- `webApp` - прямой доступ к Telegram.WebApp
- `token` - JWT токен
- `isReady` - готовность приложения
- `mainGoal` - главная цель (онбординг)
- `hasCompletedOnboarding` - завершен ли онбординг
- `hasCompletedProfile` - создан ли профиль

#### MatchContext
Управление мэтчами:
- `matchedProfiles` - список мэтчей
- `connectsCount` - количество контактов
- `updateConnectsCount` - обновление счетчика
- `addMatch` - добавление мэтча
- `setMatchedProfiles` - установка списка мэтчей

### Утилиты

#### api.js
Функции для работы с API:
- `fetchWithAuth` - запросы с авторизацией
- `getPhotoUrl` - формирование URL фотографии
- `API_ENDPOINTS` - константы endpoints

## Архитектура Backend

### Структура

#### main.py
Точка входа FastAPI:
- Настройка CORS для Telegram доменов
- Middleware для логирования
- Регистрация роутеров
- Fallback роут для POST /api/profiles/ (решение проблемы trailing slash)
- Опциональное обслуживание статических файлов

#### Модели (models.py)

**Profile** - модель профиля
- SQLAlchemy модель с валидацией
- Constraints на уровне БД
- Связи с Swipe и Match

**Swipe** - модель свайпа
- Уникальность (user_id, target_profile_id)
- Индексы для быстрого поиска

**Match** - модель мэтча
- Гарантированный порядок (user1_id < user2_id)
- Уникальность пары пользователей

#### Схемы (schemas.py)

Pydantic схемы для валидации:
- `ProfileCreate` - создание профиля
- `ProfileResponse` - ответ с профилем
- `LikeRequest` - запрос лайка
- `LikeResponse` - ответ на лайк
- `MatchResponse` - ответ с мэтчем
- `PageResponse` - пагинированный ответ

#### Роутеры

**auth.py** - Авторизация
- `POST /api/auth` - валидация Telegram initData
- Генерация JWT токена
- Извлечение user_id из initData

**profiles.py** - Профили
- `POST /api/profiles` и `POST /api/profiles/` - создание/обновление
- `GET /api/profiles` - список профилей с фильтрами
- `GET /api/profiles/{id}` - профиль по ID
- `GET /api/profiles/user/{user_id}` - профиль по user_id
- `GET /api/profiles/check/{user_id}` - проверка наличия
- `GET /api/profiles/incoming-likes` - входящие лайки

**matches.py** - Мэтчи
- `GET /api/matches` - список мэтчей
- `POST /api/profiles/{id}/like` - лайк
- `POST /api/profiles/{id}/pass` - пасс

#### Сервисы

**profile_service.py**
- `create_or_update_profile` - создание/обновление профиля
- `get_available_profiles` - получение доступных профилей (исключая просмотренные)
- `get_profile_by_id` - профиль по ID
- `get_profile_by_user_id` - профиль по user_id
- `get_incoming_likes` - входящие лайки

**match_service.py**
- `like_profile` - обработка лайка
- `pass_profile` - обработка пасса
- `get_matches` - получение мэтчей пользователя
- Автоматическое создание мэтча при взаимном лайке

**file_storage.py**
- `store_file` - загрузка файла в ImageKit
- Валидация размера (макс. 5MB)
- Валидация типа (JPEG, PNG, WebP)
- Оптимизация изображения (макс. 800x800, JPEG quality 85)
- Возврат URL загруженного изображения

## Интеграция с Telegram

### Telegram Web App SDK

Приложение использует официальный Telegram Web App SDK:
- Автоматическая инициализация при загрузке
- Получение данных пользователя через `initDataUnsafe`
- Валидация `initData` на бэкенде
- Использование Telegram UI компонентов

### Авторизация

Процесс авторизации:
1. Telegram передает `initData` в приложение
2. Frontend отправляет `initData` на бэкенд в заголовке `Authorization: tma <initData>`
3. Backend валидирует `initData` используя секретный ключ бота
4. Backend извлекает `user_id` и генерирует JWT токен
5. Frontend сохраняет токен в localStorage

### Особенности

- Поддержка всех Telegram доменов (web.telegram.org, telegram.org, desktop.telegram.org)
- CORS настроен для работы с Telegram
- Обработка отсутствия Telegram Web App (моковые данные для разработки)

## Хранение изображений

### ImageKit.io

Приложение использует ImageKit.io для хранения фотографий профилей:
- Автоматическая оптимизация изображений
- CDN для быстрой доставки
- Постоянные URL для изображений
- Хранение в папке `/networking_app/profiles/`

### Процесс загрузки

1. Пользователь выбирает файл
2. Frontend отправляет FormData на бэкенд
3. Backend валидирует файл (размер, тип)
4. Изображение оптимизируется (Pillow): макс. 800x800, JPEG quality 85
5. Файл загружается в ImageKit
6. Backend возвращает URL изображения
7. URL сохраняется в базе данных

## Данные приложения

### Города (russianCities)
Список из 100+ российских городов, включая:
- Крупные города (Москва, СПб, Новосибирск и т.д.)
- Региональные центры
- Города Крыма

### Университеты (universities)
Список из 300+ российских университетов:
- Федеральные университеты
- Национальные исследовательские университеты
- Крупные региональные университеты
- Специализированные университеты (технические, медицинские, педагогические)
- Университеты из всех федеральных округов

### Интересы (interests)
Список интересов для выбора:
- Спорт (тренажёрный зал, бег, плавание, футбол и т.д.)
- IT и технологии (IT, стартапы, программирование)
- Творчество (дизайн, фотография, искусство, музыка)
- Образование (саморазвитие, образование, наука)
- Развлечения (кино, театр, игры)
- И другие

### Цели (goals)
Цели нетворкинга:
- Совместная учёба
- Найти команду для хакатона
- Друзья по интересам
- Стажировки/работа
- Стартап
- Совместные активности
- Расширение круга

## Особенности реализации

### Оптимизация производительности

1. **Frontend:**
   - Мемоизация компонентов (React.memo)
   - useMemo для вычислений
   - useCallback для функций
   - Lazy loading изображений
   - Оптимизация анимаций (Framer Motion)
   - Предзагрузка критических ресурсов

2. **Backend:**
   - Индексы в базе данных
   - Пагинация запросов
   - Оптимизация SQL запросов
   - Кэширование (если необходимо)

### Обработка ошибок

- Try-catch блоки во всех async функциях
- Валидация данных на клиенте и сервере
- Обработка таймаутов запросов
- Fallback на моковые данные при ошибках
- Логирование ошибок в консоль

### Безопасность

- Валидация Telegram initData на бэкенде
- JWT токены для авторизации
- Валидация всех входных данных
- SQL injection защита через ORM
- CORS настройки
- Ограничение размера файлов

### UX/UI

- Мобильный-first дизайн
- Плавные анимации
- Визуальная обратная связь при действиях
- Индикаторы загрузки
- Адаптивная верстка
- Оптимизация для Telegram Web App

## Переменные окружения

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key-change-in-production-min-32-chars

# CORS
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
FRONTEND_URL=https://your-frontend-url.com

# File upload
MAX_FILE_SIZE=5242880

# ImageKit
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token

# Production flags
PRODUCTION=true
FRONTEND_ON_SAME_DOMAIN=false
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Деплой

### Backend

Поддерживаемые платформы:
- **Koyeb** - основной вариант (используется в проекте)
- **Render.com** - есть render.yaml конфигурация
- **Railway** - поддерживается через переменные окружения
- **Heroku** - через Procfile

Требования:
- PostgreSQL база данных
- Python 3.11+
- Переменные окружения настроены

### Frontend

Поддерживаемые платформы:
- **Vercel** - есть vercel.json конфигурация
- **Netlify**
- Любой статический хостинг

Требования:
- Node.js 16+
- Переменная окружения VITE_API_BASE_URL

## Известные проблемы и решения

### Проблема: POST /api/profiles/ возвращает 405

**Решение:** Добавлен fallback роут в main.py перед регистрацией роутера, который обрабатывает POST запросы к `/api/profiles/` со слэшем.

### Проблема: Бесконечные вызовы API в NetworkList

**Решение:** Использование useRef для отслеживания загрузки данных и удаление нестабильных зависимостей из useEffect.

### Проблема: Мерцание изображений при загрузке

**Решение:** Оптимизация загрузки через предзагрузку, lazy loading и правильную обработку ошибок загрузки.

## Текущее состояние

### Реализовано

✅ Авторизация через Telegram  
✅ Создание и редактирование профиля  
✅ Загрузка фотографий в ImageKit  
✅ Swipe-интерфейс для просмотра профилей  
✅ Система лайков и пассов  
✅ Автоматическое создание мэтчей  
✅ Список мэтчей (Net-Лист)  
✅ Фильтрация по городу, университету, интересам  
✅ Вкладка "Входящие лайки"  
✅ Онбординг с выбором цели  
✅ Адаптивный дизайн  
✅ Анимации свайпа  

### В разработке / Планируется

🔄 Улучшение производительности  
🔄 Дополнительные фильтры  
🔄 Уведомления о новых мэтчах  
🔄 Статистика профиля  
🔄 Расширенные настройки приватности  

## Команды для разработки

### Frontend
```bash
npm install          # Установка зависимостей
npm start           # Запуск dev сервера (localhost:3000)
npm run build       # Сборка для production
npm test            # Запуск тестов
```

### Backend
```bash
cd backend_python
python -m venv venv
venv\Scripts\activate  # Windows
# или
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

## Документация API

После запуска бэкенда доступна автоматическая документация:
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## Контакты и поддержка

Проект находится в активной разработке. Все вопросы и предложения приветствуются.

---

**Дата создания документа:** 2024  
**Последнее обновление:** Текущая версия проекта

