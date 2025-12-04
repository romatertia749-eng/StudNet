# Быстрый старт: Деплой на Render

## 🚀 Шаги деплоя

### 1. Подготовка репозитория
```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

### 2. Создание Web Service на Render

1. Зайдите на https://render.com и войдите через GitHub
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите ваш репозиторий
4. Заполните настройки:

   **Основные:**
   - **Name**: `networking-app-backend`
   - **Environment**: `Python 3`
   - **Region**: `Frankfurt` (или ближайший)
   - **Branch**: `main`
   - **Root Directory**: `backend_python` ⚠️ **ВАЖНО!**

   **Build & Deploy:**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`

   **Plan:** `Free` (или другой)

### 3. Настройка переменных окружения

В разделе **"Environment"** добавьте следующие переменные:

#### Обязательные переменные:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=jTOAbIQpMlvh_oKIVSAdYwIytGynkyo_6dtCLPLHLy0
```

#### Cloudinary (если используете):

**Вариант 1 - отдельные переменные (рекомендуется):**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Вариант 2 - одна переменная (альтернатива):**
```
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

#### Важные переменные для вашего приложения:

```
FRONTEND_URL=https://your-vercel-app.vercel.app
TELEGRAM_BOT_TOKEN=8282153203:AAEFZSTuQna3U7wJ_Yi9PgWuaumZAAAi22w
```

**Примечание:** `FRONTEND_URL` должен быть URL вашего приложения на Vercel (например, `https://your-app-name.vercel.app`). Проверьте в Vercel Dashboard → Settings → Environment Variables, там должен быть ваш домен.

#### Опциональные переменные:

```
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
MAX_FILE_SIZE=5242880
```

### 📝 Где взять значения:

- **DATABASE_URL**: См. `HOW_TO_GET_NEON_DATABASE_URL.md`
- **JWT_SECRET**: ✅ **Найден в `.env` файле**: `jTOAbIQpMlvh_oKIVSAdYwIytGynkyo_6dtCLPLHLy0`
- **TELEGRAM_BOT_TOKEN**: ✅ **Найден в `.env` файле**: `8282153203:AAEFZSTuQna3U7wJ_Yi9PgWuaumZAAAi22w`
- **FRONTEND_URL**: URL вашего фронтенда на Vercel (например `https://your-app-name.vercel.app`). 
  - Проверьте в Vercel Dashboard → ваш проект → Settings → Domains
  - Или используйте домен, который указан в переменной `REACT_APP_API_BASE_URL` в Vercel (но это URL бэкенда, а не фронтенда)
  - Обычно это что-то вроде: `https://your-project-name.vercel.app`
- **CLOUDINARY_***: Из панели Cloudinary Dashboard (или проверьте в `.env` файле, если там есть)

### 📄 Шаблон для заполнения:

См. `backend_python/RENDER_ENV_TEMPLATE.md` - там есть готовый шаблон, который вы можете заполнить своими значениями.

**Где взять DATABASE_URL:**
- **Neon**: См. подробную инструкцию в `HOW_TO_GET_NEON_DATABASE_URL.md`
  - Кратко: Neon Dashboard → ваш проект → Connection Details → скопируйте Connection String
- **Render PostgreSQL**: создайте PostgreSQL → скопируйте Internal Database URL

### 4. Создание PostgreSQL (если нужно)

1. **"New +"** → **"PostgreSQL"**
2. Настройте:
   - **Name**: `networking-app-db`
   - **Database**: `networking_app`
   - **Region**: тот же, что и Web Service
   - **Plan**: `Free`
3. Скопируйте **Internal Database URL**
4. Добавьте его как `DATABASE_URL` в Web Service

### 5. Деплой

1. Нажмите **"Create Web Service"**
2. Дождитесь завершения (2-5 минут)
3. Получите URL: `https://your-app-name.onrender.com`

### 6. Обновление фронтенда на Vercel

У вас уже есть переменная `REACT_APP_API_BASE_URL` в Vercel. Обновите её:

1. Зайдите в Vercel Dashboard → ваш проект
2. Перейдите в **Settings** → **Environment Variables**
3. Найдите переменную `REACT_APP_API_BASE_URL`
4. Обновите значение на URL вашего бэкенда на Render:
   ```
   https://your-app-name.onrender.com
   ```
5. Сохраните изменения
6. Передеплойте приложение (или подождите автоматического деплоя)

**Или** обновите вручную в `src/config/api.js` (если не используете переменные окружения):
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-app-name.onrender.com';
```

### 7. Проверка

- Health check: `https://your-app-name.onrender.com/health`
- API Docs: `https://your-app-name.onrender.com/docs`

## ⚠️ Важно

- **Free план**: приложение "засыпает" после 15 мин бездействия
- Первый запрос после пробуждения может занять 30-60 секунд
- Для production лучше использовать платный план

## 📚 Подробная инструкция

См. `backend_python/DEPLOY_RENDER.md` для детальной информации.

