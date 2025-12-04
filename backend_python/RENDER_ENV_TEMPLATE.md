# Шаблон переменных окружения для Render

Скопируйте этот шаблон и заполните своими значениями, затем добавьте в Render Dashboard → Environment Variables.

## 📋 Шаблон для копирования:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=jTOAbIQpMlvh_oKIVSAdYwIytGynkyo_6dtCLPLHLy0
FRONTEND_URL=ВАШ_FRONTEND_URL_ЗДЕСЬ
TELEGRAM_BOT_TOKEN=8282153203:AAEFZSTuQna3U7wJ_Yi9PgWuaumZAAAi22w
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
```

## 🔧 Как заполнить:

### 1. DATABASE_URL
- Скопируйте из Neon Dashboard (см. `HOW_TO_GET_NEON_DATABASE_URL.md`)
- Или из Render PostgreSQL (Internal Database URL)

### 2. JWT_SECRET
- ✅ **Уже найден в `.env` файле**: `jTOAbIQpMlvh_oKIVSAdYwIytGynkyo_6dtCLPLHLy0`
- Используйте это значение

### 3. FRONTEND_URL
- URL вашего фронтенда на Vercel
- Проверьте в Vercel Dashboard → ваш проект → Settings → Domains
- Обычно это: `https://your-project-name.vercel.app`
- Примеры:
  - `https://your-app.vercel.app`
  - `https://your-app-name.vercel.app`

### 4. TELEGRAM_BOT_TOKEN
- ✅ **Уже найден в `.env` файле**: `8282153203:AAEFZSTuQna3U7wJ_Yi9PgWuaumZAAAi22w`
- Используйте это значение

### 5. CLOUDINARY_* (если используете)
- Получите из Cloudinary Dashboard
- Или используйте одну переменную `CLOUDINARY_URL` вместо трех

## ⚠️ Важно:

- **НЕ коммитьте** этот файл с реальными значениями в Git
- Добавляйте переменные только в Render Dashboard
- Используйте уникальный JWT_SECRET для production

