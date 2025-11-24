# Как найти правильный URL бэкенда

## Проблема: /health открывает фронтенд вместо бэкенда

Это значит, что вы используете URL фронтенда (Vercel), а не бэкенда (Railway).

## У вас должно быть ДВА разных URL:

1. **Фронтенд (Vercel):** `https://stud-net.vercel.app` - это ваше React приложение
2. **Бэкенд (Railway):** `https://xxx.up.railway.app` - это ваш FastAPI сервер

## Шаг 1: Найти URL бэкенда на Railway

### Вариант 1: Через Settings → Networking

1. Зайдите на [railway.app](https://railway.app)
2. Откройте ваш **проект**
3. Найдите сервис с **Python/FastAPI** (НЕ PostgreSQL!)
4. Откройте этот сервис
5. Перейдите в **Settings** → **Networking**
6. Найдите **Public Domain**

**Если его нет:**
- Нажмите **Generate Domain** или **Create Public Domain**
- Подождите несколько секунд
- URL появится (например: `https://studnet-production-xxx.up.railway.app`)

### Вариант 2: Через Deployments

1. Railway → ваш проект → сервис с бэкендом
2. **Deployments** → последний деплой
3. В логах или в правом верхнем углу может быть URL

### Вариант 3: Проверить список сервисов

1. На странице проекта Railway посмотрите список сервисов
2. У вас должно быть минимум 2 сервиса:
   - **PostgreSQL** (база данных) - это НЕ бэкенд
   - **Python/FastAPI** или что-то с Python - это бэкенд

**Если видите только PostgreSQL:**
- Бэкенд не задеплоен
- Нужно задеплоить (см. инструкции выше)

## Шаг 2: Проверить, что это бэкенд

После того как нашли URL, откройте в браузере:
```
https://ваш-railway-url.up.railway.app/health
```

**Должно вернуть:** `{"status":"ok"}` (JSON, не HTML страница)

**Если возвращает HTML или перенаправляет:**
- Это не бэкенд, а фронтенд
- Нужно найти другой сервис на Railway

## Шаг 3: Если бэкенд не задеплоен

Если на Railway видите только PostgreSQL:

1. Railway → ваш проект → **+ New**
2. Выберите **GitHub Repo**
3. Выберите ваш репозиторий
4. Railway создаст сервис
5. Настройте:
   - **Settings** → **Service** → **Root Directory**: `backend_python`
   - **Settings** → **Service** → **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. После деплоя появится URL в **Settings** → **Networking**

## Шаг 4: Обновить переменную на Vercel

После того как нашли правильный URL бэкенда:

1. Vercel → Settings → Environment Variables
2. Измените `REACT_APP_API_BASE_URL` на URL бэкенда (Railway)
3. Пересоберите проект (Redeploy)

## Как отличить фронтенд от бэкенда:

**Фронтенд (Vercel):**
- URL: `https://stud-net.vercel.app`
- Открывает `/health` → показывает HTML страницу или перенаправляет
- Это React приложение

**Бэкенд (Railway):**
- URL: `https://xxx.up.railway.app` (Railway домен)
- Открывает `/health` → возвращает `{"status":"ok"}` (JSON)
- Это FastAPI сервер

## Что сделать СЕЙЧАС:

1. Зайдите на Railway → ваш проект
2. Посмотрите список сервисов
3. Найдите сервис с Python/FastAPI (не PostgreSQL)
4. Откройте его → Settings → Networking
5. Найдите или создайте Public Domain
6. Скопируйте URL
7. Проверьте: `https://этот-url/health` → должно вернуть JSON

Сообщите, какие сервисы вы видите на Railway и какой URL у бэкенда.

