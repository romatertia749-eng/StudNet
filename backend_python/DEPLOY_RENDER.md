# Инструкция по деплою бэкенда на Render

## Шаг 1: Подготовка

1. Убедитесь, что все изменения закоммичены в Git:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

## Шаг 2: Создание аккаунта и проекта на Render

1. Перейдите на https://render.com
2. Зарегистрируйтесь или войдите в аккаунт (можно через GitHub)
3. Нажмите "New +" → "Web Service"

## Шаг 3: Подключение репозитория

1. Выберите ваш репозиторий (GitHub/GitLab/Bitbucket)
2. Выберите ветку (обычно `main` или `master`)
3. Нажмите "Connect"

## Шаг 4: Настройка Web Service

### Основные настройки:
- **Name**: `networking-app-backend` (или любое другое имя)
- **Environment**: `Python 3`
- **Region**: Выберите ближайший регион (например, Frankfurt)
- **Branch**: `main` (или ваша основная ветка)
- **Root Directory**: `backend_python` (важно!)

### Build & Deploy:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`

### План:
- Выберите **Free** план (или другой по необходимости)

## Шаг 5: Настройка переменных окружения

В разделе "Environment Variables" добавьте:

### Обязательные переменные:

1. **DATABASE_URL** ⚠️ **ОБЯЗАТЕЛЬНО**
   - Формат: `postgresql://user:password@host:port/database`
   - Если используете Neon, скопируйте Connection String из панели Neon
   - Пример: `postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

2. **JWT_SECRET** ⚠️ **ОБЯЗАТЕЛЬНО для production**
   - Секретный ключ для подписи JWT токенов
   - Должен быть длинным и случайным (минимум 32 символа)
   - Пример: `your-super-secret-jwt-key-min-32-chars-long-random-string`
   - ⚠️ **ВАЖНО**: Используйте уникальный секретный ключ, не используйте значение по умолчанию!

3. **CLOUDINARY_CLOUD_NAME**, **CLOUDINARY_API_KEY**, **CLOUDINARY_API_SECRET** (если используете Cloudinary)
   - Получите из панели Cloudinary Dashboard
   - Или используйте одну переменную **CLOUDINARY_URL** вместо трех:
     - Формат: `cloudinary://api_key:api_secret@cloud_name`

### Опциональные переменные:

4. **CORS_ORIGINS** (опционально)
   - Разрешенные домены через запятую
   - Пример: `https://web.telegram.org,https://telegram.org`

5. **FRONTEND_URL** (опционально)
   - URL вашего фронтенда, если он развернут отдельно

6. **MAX_FILE_SIZE** (опционально)
   - Максимальный размер загружаемого файла в байтах
   - По умолчанию: `5242880` (5MB)

7. **TELEGRAM_BOT_TOKEN** (опционально)
   - Токен Telegram бота, если используете

### Пример настройки:
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-random-string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
```

**Или с CLOUDINARY_URL:**
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-random-string
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
```

## Шаг 6: Создание PostgreSQL базы данных (если нужно)

Если у вас еще нет базы данных:

1. В Render Dashboard нажмите "New +" → "PostgreSQL"
2. Настройте:
   - **Name**: `networking-app-db`
   - **Database**: `networking_app`
   - **User**: `networking_user`
   - **Region**: Выберите тот же регион, что и Web Service
   - **Plan**: Free (или другой)
3. После создания скопируйте **Internal Database URL** или **External Database URL**
4. Добавьте его как переменную `DATABASE_URL` в ваш Web Service

## Шаг 7: Деплой

1. Нажмите "Create Web Service"
2. Render начнет деплой автоматически
3. Дождитесь завершения (обычно 2-5 минут)
4. После успешного деплоя вы получите URL вида: `https://your-app-name.onrender.com`

## Шаг 8: Обновление конфигурации фронтенда

Обновите `src/config/api.js` или создайте `.env` файл в корне проекта:

```env
REACT_APP_API_BASE_URL=https://your-app-name.onrender.com
```

Или в `src/config/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-app-name.onrender.com';
```

## Шаг 9: Проверка работы

1. Откройте в браузере: `https://your-app-name.onrender.com/health`
   - Должен вернуться: `{"status":"ok"}`

2. Откройте документацию API: `https://your-app-name.onrender.com/docs`

3. Проверьте логи в Render Dashboard → Logs

## Решение проблем

### Ошибка "DATABASE_URL environment variable is required"
- Убедитесь, что переменная `DATABASE_URL` добавлена в Environment Variables
- Проверьте формат URL (должен начинаться с `postgresql://`)

### Ошибка подключения к базе данных
- Проверьте, что база данных создана и запущена
- Убедитесь, что используете правильный URL (Internal или External)
- Проверьте, что в URL указан правильный порт (обычно 5432)

### CORS ошибки
- Добавьте ваш фронтенд URL в `CORS_ORIGINS`
- Или добавьте `FRONTEND_URL` переменную
- Убедитесь, что в `app/main.py` правильно настроены allowed_origins

### Ошибка "Module not found"
- Проверьте, что все зависимости указаны в `requirements.txt`
- Убедитесь, что `Root Directory` установлен в `backend_python`

### Приложение не запускается
- Проверьте логи в Render Dashboard
- Убедитесь, что `Start Command` правильный
- Проверьте, что порт использует переменную `$PORT`

## Автоматический деплой

Render автоматически деплоит при каждом push в подключенную ветку.

## Мониторинг

- **Logs**: Просмотр логов в реальном времени
- **Metrics**: Мониторинг CPU, памяти, запросов
- **Events**: История деплоев и событий

## Обновление

Для обновления просто сделайте push в репозиторий:
```bash
git add .
git commit -m "Update backend"
git push
```

Render автоматически обнаружит изменения и запустит новый деплой.

## Важные замечания

1. **Free план**: 
   - Приложение "засыпает" после 15 минут бездействия
   - Первый запрос после пробуждения может занять 30-60 секунд
   - Для production лучше использовать платный план

2. **База данных (Free план)**:
   - База данных удаляется через 90 дней без использования
   - Ограничение 1 ГБ данных
   - Для production используйте платный план или внешнюю БД (Neon, Supabase)

3. **Переменные окружения**:
   - Не храните секреты в коде
   - Используйте Environment Variables в Render Dashboard

4. **Логи**:
   - Логи доступны в реальном времени в Render Dashboard
   - Хранятся последние 1000 строк

## Полезные ссылки

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- Render Status: https://status.render.com

