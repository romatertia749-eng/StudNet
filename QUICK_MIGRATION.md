# Быстрая миграция на Koyeb + Vercel

## 1. База данных (Neon) - 5 минут

1. [neon.tech](https://neon.tech) → Sign Up
2. New Project → скопируйте connection string
3. SQL Editor → вставьте `database/schema.sql` → Run

## 2. Бэкенд (Koyeb) - 10 минут

1. [koyeb.com](https://koyeb.com) → Sign Up
2. Create App → Web Service
3. Connect GitHub → выберите репозиторий
4. Settings:
   - Build: **Buildpack** (автоматически определит Python из `requirements.txt` и `runtime.txt`)
   - Root: `backend_python`
   - Port: автоматически (использует `$PORT` из `Procfile`)
   
   Koyeb автоматически обнаружит Python buildpack благодаря наличию `requirements.txt` и `Procfile` в папке `backend_python`.
5. Environment Variables (Settings → Environment Variables):
   ```
   DATABASE_URL = ваш-neon-connection-string
   JWT_SECRET = Ie4u1NrxB9nGyEqV7TR-LX7NALj23NXj3n1CONxqU-78vjvjLUDamXNEUuXM3nWv
   IMAGEKIT_PUBLIC_KEY = ваш-ключ
   IMAGEKIT_PRIVATE_KEY = ваш-ключ
   IMAGEKIT_URL_ENDPOINT = ваш-endpoint
   TELEGRAM_BOT_TOKEN = ваш-токен-бота-телеграм
   PRODUCTION = true
   CORS_ORIGINS = https://web.telegram.org,https://telegram.org,https://desktop.telegram.org,https://webk.telegram.org,https://webz.telegram.org
   FRONTEND_URL = https://your-app.vercel.app (пока заглушка, обновите после деплоя фронта)
   ```
7. Deploy → скопируйте URL (например: `https://xxx.koyeb.app`)

## 3. Фронтенд (Vercel) - 5 минут

1. [vercel.com](https://vercel.com) → Sign Up
2. Add New Project → Import GitHub repo
3. Settings:
   - Framework: Create React App
   - Build: `npm run build`
   - Output: `build`
4. Environment Variables:
   ```
   REACT_APP_API_BASE_URL = https://xxx.koyeb.app (URL из шага 2)
   ```
5. Deploy → скопируйте URL (например: `https://xxx.vercel.app`)

## 4. Финальная настройка

1. В Koyeb обновите `FRONTEND_URL` на ваш Vercel URL
2. В Vercel проверьте `REACT_APP_API_BASE_URL` на ваш Koyeb URL
3. Передеплойте оба сервиса

## Готово! 🎉

Проверьте:
- `https://your-koyeb-url.koyeb.app/health` → должно вернуть `{"status":"ok"}`
- Откройте Vercel URL и проверьте работу приложения

## Если что-то не работает

**Бэкенд не отвечает:**
- Проверьте логи в Koyeb Dashboard
- Убедитесь, что все secrets добавлены
- Проверьте `DATABASE_URL`

**CORS ошибки:**
- Проверьте `CORS_ORIGINS` в Koyeb
- Убедитесь, что `FRONTEND_URL` правильный

**Фронт не видит API:**
- Проверьте `REACT_APP_API_BASE_URL` в Vercel
- Пересоберите проект (Redeploy)

