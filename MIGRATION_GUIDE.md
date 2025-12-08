# Руководство по миграции на Koyeb + Vercel + Neon

## Архитектура

- **Frontend**: Vercel (React)
- **Backend**: Koyeb (FastAPI)
- **Database**: Neon PostgreSQL (бесплатный tier)
- **File Storage**: ImageKit (уже настроен)

## Шаг 1: Настройка базы данных (Neon)

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте connection string (формат: `postgresql://user:password@host/dbname`)
4. Выполните миграцию схемы:
   ```bash
   psql "your-neon-connection-string" < database/schema.sql
   ```
   Или через Neon Dashboard → SQL Editor → вставьте содержимое `database/schema.sql`

## Шаг 2: Деплой бэкенда на Koyeb

### Вариант A: Через Koyeb Dashboard

1. Зарегистрируйтесь на [koyeb.com](https://koyeb.com)
2. Создайте новый App → Web Service
3. Подключите GitHub репозиторий
4. Настройки:
   - **Build**: Buildpack (автоматически определит Python из `requirements.txt` и `runtime.txt`)
   - **Root Path**: `backend_python`
   - **Port**: автоматически (использует `$PORT` из `Procfile`)
5. Добавьте Environment Variables (Settings → Environment Variables):
   - `DATABASE_URL` - connection string от Neon
   - `JWT_SECRET=Ie4u1NrxB9nGyEqV7TR-LX7NALj23NXj3n1CONxqU-78vjvjLUDamXNEUuXM3nWv` (сгенерированный токен)
   - `IMAGEKIT_PUBLIC_KEY` - ваш ключ ImageKit
   - `IMAGEKIT_PRIVATE_KEY` - ваш приватный ключ ImageKit
   - `IMAGEKIT_URL_ENDPOINT` - ваш endpoint ImageKit
   - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
   - `PRODUCTION=true`
   - `CORS_ORIGINS=https://web.telegram.org,https://telegram.org,https://desktop.telegram.org,https://webk.telegram.org,https://webz.telegram.org`
   - `FRONTEND_URL=https://your-app.vercel.app` (замените на ваш Vercel URL после деплоя)

### Вариант B: Через Koyeb CLI

```bash
# Установите Koyeb CLI
curl -fsSL https://cli.koyeb.com/install.sh | sh

# Логин
koyeb login

# Деплой (buildpack автоматически определится)
cd backend_python
koyeb app create networking-app-backend
koyeb service create networking-app-backend \
  --app networking-app-backend \
  --buildpack heroku/python \
  --env PRODUCTION=true \
  --env DATABASE_URL="your-neon-connection-string" \
  --env JWT_SECRET="Ie4u1NrxB9nGyEqV7TR-LX7NALj23NXj3n1CONxqU-78vjvjLUDamXNEUuXM3nWv" \
  --env IMAGEKIT_PUBLIC_KEY="your-key" \
  --env IMAGEKIT_PRIVATE_KEY="your-key" \
  --env IMAGEKIT_URL_ENDPOINT="your-endpoint" \
  --env TELEGRAM_BOT_TOKEN="your-bot-token" \
  --env CORS_ORIGINS="https://web.telegram.org,https://telegram.org,https://desktop.telegram.org,https://webk.telegram.org,https://webz.telegram.org" \
  --env FRONTEND_URL="https://your-app.vercel.app"
```

После деплоя скопируйте URL бэкенда (например: `https://networking-app-backend-xxx.koyeb.app`)

## Шаг 3: Деплой фронтенда на Vercel

1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Импортируйте GitHub репозиторий
3. Настройки проекта:
   - **Framework Preset**: Create React App
   - **Root Directory**: `.` (корень проекта)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Добавьте Environment Variable:
   - `REACT_APP_API_BASE_URL` = URL вашего Koyeb бэкенда (например: `https://networking-app-backend-xxx.koyeb.app`)
5. Деплой!

## Шаг 4: Обновление конфигурации

После получения URL бэкенда от Koyeb:

1. Обновите `FRONTEND_URL` в Koyeb на ваш Vercel URL
2. Обновите `REACT_APP_API_BASE_URL` в Vercel на ваш Koyeb URL
3. Передеплойте оба сервиса

## Шаг 5: Проверка

1. Откройте ваш Vercel URL
2. Проверьте `/health` endpoint бэкенда: `https://your-koyeb-url.koyeb.app/health`
3. Проверьте работу API через фронтенд

## Альтернативы

### База данных
- **Supabase** (supabase.com) - PostgreSQL + дополнительные фичи
- **Railway** (railway.app) - PostgreSQL + другие сервисы
- **PlanetScale** (planetscale.com) - MySQL (потребует изменения кода)

### Бэкенд
- **Railway** (railway.app) - проще настройка, но дороже
- **Fly.io** (fly.io) - хорошая производительность
- **Render** (render.com) - бесплатный tier, но медленнее

## Преимущества этой архитектуры

✅ **Бесплатные tier'ы** для старта
✅ **Автоматический деплой** из GitHub
✅ **Buildpack вместо Dockerfile** - проще и быстрее
✅ **Масштабируемость** - легко увеличить ресурсы
✅ **Надежность** - меньше проблем с собственным сервером
✅ **CDN** для статики через Vercel
✅ **SSL сертификаты** автоматически

## Мониторинг

- **Koyeb**: Dashboard показывает логи и метрики
- **Vercel**: Analytics встроен
- **Neon**: Dashboard показывает использование БД

## Troubleshooting

### Бэкенд не запускается
- Проверьте логи в Koyeb Dashboard
- Убедитесь, что все secrets добавлены
- Проверьте, что `DATABASE_URL` правильный

### CORS ошибки
- Убедитесь, что `CORS_ORIGINS` содержит все нужные домены
- Проверьте, что `FRONTEND_URL` правильный

### Фронтенд не подключается к API
- Проверьте `REACT_APP_API_BASE_URL` в Vercel
- Убедитесь, что переменная начинается с `REACT_APP_`
- Пересоберите проект после изменения переменных

