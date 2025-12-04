# Шаблон переменных окружения для Koyeb

Скопируйте этот шаблон и заполните своими значениями, затем добавьте в Koyeb Dashboard → Environment Variables.

## 📋 Шаблон для копирования:

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-random-string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
FRONTEND_URL=https://your-frontend-url.com
MAX_FILE_SIZE=5242880
TELEGRAM_BOT_TOKEN=your_bot_token
```

## 🔧 Как заполнить:

### 1. DATABASE_URL ⚠️ ОБЯЗАТЕЛЬНО
- Скопируйте из Neon Dashboard (см. `HOW_TO_GET_NEON_DATABASE_URL.md`)
- Или из другого PostgreSQL провайдера
- Формат: `postgresql://user:pass@host:port/dbname?sslmode=require`

### 2. JWT_SECRET ⚠️ ОБЯЗАТЕЛЬНО
- Сгенерируйте уникальный ключ минимум 32 символа
- Команда для генерации:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- Или используйте онлайн генератор: https://randomkeygen.com/
- ⚠️ **ВАЖНО**: Используйте уникальный ключ, не используйте значение по умолчанию!

### 3. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Получите из Cloudinary Dashboard: https://cloudinary.com/console
- В Dashboard найдите:
  - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
  - **API Key** → `CLOUDINARY_API_KEY`
  - **API Secret** → `CLOUDINARY_API_SECRET`

**Альтернатива:** Используйте одну переменную вместо трех:
```
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 4. CORS_ORIGINS (опционально)
- Разрешенные домены через запятую
- Для Telegram Mini Apps:
  ```
  CORS_ORIGINS=https://web.telegram.org,https://telegram.org
  ```

### 5. FRONTEND_URL (опционально)
- URL вашего фронтенда
- Примеры:
  - `https://your-app.vercel.app`
  - `https://your-app.netlify.app`

### 6. MAX_FILE_SIZE (опционально)
- Максимальный размер файла в байтах
- По умолчанию: `5242880` (5MB)
- Для 10MB: `10485760`

### 7. TELEGRAM_BOT_TOKEN (опционально)
- Токен Telegram бота
- Получить у @BotFather в Telegram

## ⚠️ Важно:

- **НЕ коммитьте** этот файл с реальными значениями в Git
- Добавляйте переменные только в Koyeb Dashboard
- Используйте уникальный JWT_SECRET для production
- Проверьте все значения перед сохранением

## 📝 Минимальный набор (только обязательные):

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-random-string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

