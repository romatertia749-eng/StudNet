# Networking App Backend (FastAPI)

## Архитектура

- **Backend**: Koyeb (FastAPI)
- **Database**: Neon PostgreSQL
- **Frontend**: Vercel (React)
- **File Storage**: ImageKit

## Локальная разработка

### Установка

1. Создай виртуальное окружение:
```bash
python -m venv venv
```

2. Активируй виртуальное окружение:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Установи зависимости:
```bash
pip install -r requirements.txt
```

### Настройка

Создай файл `.env` на основе `env.example`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-secret-key-here
IMAGEKIT_PUBLIC_KEY=your-key
IMAGEKIT_PRIVATE_KEY=your-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
TELEGRAM_BOT_TOKEN=your-token
PRODUCTION=false
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
FRONTEND_URL=http://localhost:3000
```

### Запуск

```bash
uvicorn app.main:app --reload --port 8080
```

API будет доступен на `http://localhost:8080`

## Production (Koyeb)

Все переменные окружения настраиваются через Koyeb Dashboard:
Settings → Environment Variables

Обязательные переменные:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - секретный ключ для JWT
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
- `TELEGRAM_BOT_TOKEN`
- `PRODUCTION=true`
- `CORS_ORIGINS` - домены Telegram Web Apps
- `FRONTEND_URL` - URL фронтенда на Vercel

## Endpoints

- `GET /health` - проверка здоровья сервиса
- `GET /api/profiles?userId=...` - получить список профилей
- `POST /api/profiles` - создать/обновить профиль
- `GET /api/profiles/{id}` - получить профиль по ID
- `POST /api/profiles/{id}/like` - лайкнуть профиль
- `POST /api/profiles/{id}/pass` - пропустить профиль
- `GET /api/matches?userId=...` - получить список мэтчей

## Документация API

После запуска доступна автоматическая документация:
- Swagger UI: `http://localhost:8080/docs` (локально) или `https://your-app.koyeb.app/docs` (production)
- ReDoc: `http://localhost:8080/redoc` (локально) или `https://your-app.koyeb.app/redoc` (production)

