# Настройка для деплоя на Vercel

## Переменные окружения

### На Vercel (фронтенд)

В настройках проекта Vercel добавьте переменную окружения:

```
REACT_APP_API_BASE_URL=https://your-backend-url.com
```

**Важно:** Замените `https://your-backend-url.com` на реальный URL вашего бэкенда.

**Как найти URL бэкенда?** См. файл `HOW_TO_FIND_BACKEND_URL.md`

**Примеры:**
- Railway: `https://your-app.up.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app.herokuapp.com`

### На бэкенде (Railway/Render/Heroku)

Добавьте следующие переменные окружения:

```bash
# URL фронтенда (ваш Vercel домен)
FRONTEND_URL=https://your-app.vercel.app

# CORS origins (через запятую, без пробелов)
CORS_ORIGINS=https://your-app.vercel.app,https://web.telegram.org

# База данных
DATABASE_URL=postgresql://user:password@host:port/database

# Остальные настройки (см. backend_python/ENV_EXPLANATION.md)
UPLOAD_DIR=./uploads/photos
MAX_FILE_SIZE=5242880
JWT_SECRET=your-secret-key-here
TELEGRAM_BOT_TOKEN=your-bot-token-here
```

## Проверка после деплоя

1. **Откройте консоль браузера** (F12) в Telegram Web App
2. **Проверьте логи:**
   - `API_BASE_URL: ...` - должен быть URL вашего бэкенда
   - `API_ENDPOINTS.PROFILES: ...` - должен быть полный URL

3. **Попробуйте создать профиль:**
   - Заполните форму
   - Нажмите "Сохранить"
   - В консоли должны появиться:
     - `Sending profile data to: ...`
     - `User ID: ...`
     - `Response status: 200` (если успешно)

4. **Если видите ошибки:**
   - **CORS error** - проверьте `FRONTEND_URL` и `CORS_ORIGINS` на бэкенде
   - **Failed to fetch** - проверьте, что бэкенд запущен и доступен
   - **400/500 error** - проверьте логи бэкенда

## Быстрая проверка бэкенда

```bash
# Проверка health
curl https://your-backend-url.com/health

# Должен вернуть: {"status":"ok"}
```

## Частые проблемы

### Проблема: "Failed to fetch"
**Решение:** 
- Проверьте, что `REACT_APP_API_BASE_URL` указан правильно на Vercel
- Убедитесь, что бэкенд запущен и доступен
- Проверьте, что URL начинается с `https://` (не `http://`)

### Проблема: CORS error
**Решение:**
- Добавьте ваш Vercel домен в `FRONTEND_URL` на бэкенде
- Добавьте в `CORS_ORIGINS` через запятую: `https://your-app.vercel.app,https://web.telegram.org`
- Перезапустите бэкенд

### Проблема: "Ошибка при сохранении профиля"
**Решение:**
- Откройте консоль браузера (F12)
- Посмотрите на ошибку в консоли
- Проверьте логи бэкенда
- Убедитесь, что база данных подключена и таблицы созданы

## После успешного деплоя

1. Обновите URL в BotFather:
   - Откройте `@BotFather` в Telegram
   - Команда `/myapps`
   - Выберите ваше приложение
   - `Edit Web App URL`
   - Вставьте URL вашего Vercel приложения

2. Протестируйте в Telegram:
   - Откройте бота
   - Нажмите на кнопку с Web App
   - Попробуйте создать профиль

