# Telegram Networking App

React-приложение для нетворкинга, работающее как Telegram Web App.

## Описание

Приложение для поиска и взаимодействия с другими пользователями через Telegram. Пользователи создают профили, просматривают других пользователей и получают мэтчи при взаимной симпатии.

## Технологический стек

- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI (Python)
- **База данных**: PostgreSQL
- **Платформа**: Telegram Web Apps

## Структура проекта

```
├── src/                    # React приложение
│   ├── components/         # React компоненты
│   ├── pages/             # Страницы приложения
│   ├── contexts/          # React контексты (WebAppContext)
│   ├── config/            # Конфигурация API
│   └── utils/             # Утилиты
├── backend_python/         # FastAPI бэкенд
│   └── app/
│       ├── routers/       # API роутеры
│       ├── services/      # Бизнес-логика
│       ├── models.py      # SQLAlchemy модели
│       └── schemas.py     # Pydantic схемы
├── database/              # SQL схемы
└── public/                # Статические файлы
```

## Быстрый старт

### 1. База данных

```bash
# Создайте базу данных
psql -U postgres
CREATE DATABASE networking_app;
\q

# Примените схему
psql -U postgres -d networking_app -f database/schema.sql
```

### 2. Бэкенд

```bash
cd backend_python

# Создайте виртуальное окружение
python -m venv venv

# Активируйте (Windows)
venv\Scripts\activate

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл (см. backend_python/ENV_EXPLANATION.md)
# DATABASE_URL=postgresql://user:password@localhost:5432/networking_app

# Запустите сервер
uvicorn app.main:app --reload --port 8080
```

API будет доступен на `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

### 3. Фронтенд

```bash
# Установите зависимости
npm install

# Создайте .env файл
echo "REACT_APP_API_BASE_URL=http://localhost:8080" > .env

# Запустите в режиме разработки
npm start
```

Приложение откроется на `http://localhost:3000`

## Интеграция с Telegram

### Telegram Web App SDK

SDK подключен в `public/index.html`:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### Использование в коде

Приложение использует `WebAppContext` для работы с Telegram API:

```javascript
import { useWebApp } from './contexts/WebAppContext';

function MyComponent() {
  const { userInfo, webApp, token, closeApp } = useWebApp();
  
  // userInfo содержит данные пользователя из Telegram
  // { id, first_name, last_name, username, language_code }
}
```

### Доступные функции

- `userInfo` - информация о пользователе Telegram
- `token` - JWT токен после авторизации
- `webApp` - прямой доступ к `window.Telegram.WebApp`
- `closeApp()` - закрытие мини-приложения
- `requestContact()` - запрос контакта пользователя

## Развертывание

### Локальное тестирование с ngrok

Для тестирования в Telegram нужен HTTPS. Используйте ngrok:

1. Запустите ngrok для фронтенда:
   ```bash
   ngrok http 3000
   ```

2. Запустите ngrok для бэкенда:
   ```bash
   ngrok http 8080
   ```

3. Обновите `.env`:
   ```env
   REACT_APP_API_BASE_URL=https://your-backend.ngrok.io
   ```

4. Обновите URL в BotFather (команда `/myapps` → `Edit Web App URL`)

Подробнее: `TELEGRAM_LAUNCH.md`

### Production деплой

1. **Фронтенд** (Vercel/Netlify):
   ```bash
   npm run build
   # Загрузите build/ на хостинг
   ```

2. **Бэкенд** (Koyeb/Railway/Render):
   - Настройте переменные окружения
   - Подключите PostgreSQL
   - Деплой через Git

3. **Настройка бота**:
   - Откройте [@BotFather](https://t.me/BotFather)
   - `/myapps` → выберите приложение
   - `Edit Web App URL` → укажите URL фронтенда

## API Endpoints

### Аутентификация
- `POST /api/auth` - авторизация через Telegram initData

### Профили
- `GET /api/profiles?userId=...` - получить список профилей
- `POST /api/profiles` - создать/обновить профиль
- `GET /api/profiles/{id}` - получить профиль по ID
- `POST /api/profiles/{id}/like` - лайкнуть профиль
- `POST /api/profiles/{id}/pass` - пропустить профиль

### Мэтчи
- `GET /api/matches?userId=...` - получить список мэтчей

## Документация

- `QUICK_START.md` - быстрый старт
- `TELEGRAM_SETUP.md` - настройка Telegram
- `TELEGRAM_LAUNCH.md` - запуск в Telegram
- `backend_python/README.md` - документация бэкенда
- `backend_python/ENV_EXPLANATION.md` - переменные окружения

## Особенности

- ✅ Автоматическая авторизация через Telegram
- ✅ Мобильный-first дизайн
- ✅ Swipe-интерфейс для карточек
- ✅ Система мэтчинга
- ✅ Загрузка фото профиля
- ✅ Фильтрация по интересам

## Разработка

### Сборка для production

```bash
npm run build
```

Собранные файлы будут в папке `build/`

### Тестирование

```bash
npm test
```

## Требования

- Node.js 16+
- Python 3.8+
- PostgreSQL 12+
- Telegram бот (созданный через @BotFather)

## Лицензия

MIT
