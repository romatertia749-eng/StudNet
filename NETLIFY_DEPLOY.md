# 🚀 Деплой на Netlify + Koyeb + Neon

## 📋 Быстрая настройка

### 1. База данных (Neon) - 5 минут

1. [neon.tech](https://neon.tech) → Sign Up
2. New Project → скопируйте connection string
3. SQL Editor → вставьте `database/schema.sql` → Run

### 2. Бэкенд (Koyeb) - 10 минут

1. [koyeb.com](https://koyeb.com) → Sign Up
2. Create App → Web Service
3. Connect GitHub → выберите репозиторий
4. Settings:
   - Build: **Buildpack** (автоматически определит Python)
   - Root: `backend_python`
   - Port: автоматически (из Procfile)
5. Environment Variables (Settings → Environment Variables):
   ```
   DATABASE_URL = ваш-neon-connection-string
   JWT_SECRET = Ie4u1NrxB9nGyEqV7TR-LX7NALj23NXj3n1CONxqU-78vjvjLUDamXNEUuXM3nWv
   IMAGEKIT_PUBLIC_KEY = ваш-ключ
   IMAGEKIT_PRIVATE_KEY = ваш-ключ
   IMAGEKIT_URL_ENDPOINT = ваш-endpoint
   TELEGRAM_BOT_TOKEN = ваш-токен
   PRODUCTION = true
   CORS_ORIGINS = https://web.telegram.org,https://telegram.org,https://desktop.telegram.org,https://webk.telegram.org,https://webz.telegram.org
   FRONTEND_URL = https://your-site.netlify.app (обновите после деплоя фронта)
   ```
6. Deploy → скопируйте URL (например: `https://xxx.koyeb.app`)

### 3. Фронтенд (Netlify) - 5 минут

1. [netlify.com](https://netlify.com) → Sign Up
2. Add new site → Import an existing project
3. Connect to Git provider → выберите GitHub → выберите репозиторий
4. Build settings (автоматически определится из `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `build`
5. **Environment Variables (КРИТИЧЕСКИ ВАЖНО!):**
   - Нажми "Show advanced" → "New variable"
   - Добавьте переменную:
     - **Key**: `REACT_APP_API_BASE_URL`
     - **Value**: `https://xxx.koyeb.app` (URL вашего бэкенда из шага 2)
     - **Scopes**: Production, Deploy previews, Branch deploys (выберите все)
   - Сохраните
6. Deploy site → скопируйте URL (например: `https://xxx.netlify.app`)

### 4. Финальная настройка

1. В Koyeb обновите `FRONTEND_URL` на ваш Netlify URL
2. В Netlify проверьте `REACT_APP_API_BASE_URL` на ваш Koyeb URL
3. Передеплойте оба сервиса:
   - В Netlify: Deploys → Trigger deploy → Deploy site
   - В Koyeb: автоматически или через Redeploy

## ✅ Проверка

- `https://your-koyeb-url.koyeb.app/health` → должно вернуть `{"status":"ok"}`
- Откройте Netlify URL и проверьте работу приложения
- Проверьте консоль браузера (F12) - должно быть: `API_BASE_URL: https://your-koyeb-url.koyeb.app`

## 🔄 Обычный деплой (после настройки)

```powershell
git add .
git commit -m "Описание изменений"
git push origin main
```

**Всё!** Netlify и Koyeb автоматически задеплоят изменения.

## ⚠️ Если что-то не работает

**Фронт не видит API:**
- Проверьте `REACT_APP_API_BASE_URL` в Netlify (Site settings → Environment variables)
- Убедитесь, что значение начинается с `https://`
- Убедитесь, что переменная включена для всех scopes (Production, Deploy previews, Branch deploys)
- ⚠️ **ВАЖНО**: После изменения переменных окружения нужно передеплоить сайт (Trigger deploy → Deploy site)

**CORS ошибки:**
- Проверьте `FRONTEND_URL` в Koyeb (должен быть ваш Netlify URL)
- Проверьте `CORS_ORIGINS` в Koyeb

**Бэкенд не отвечает:**
- Проверьте логи в Koyeb Dashboard
- Убедитесь, что все переменные окружения добавлены
- Проверьте `DATABASE_URL`

## 📝 Преимущества Netlify

- ✅ Бесплатный tier с хорошими лимитами
- ✅ Автоматический деплой из GitHub
- ✅ CDN для статики
- ✅ SSL сертификаты автоматически
- ✅ Deploy previews для pull requests
- ✅ Простая настройка переменных окружения
