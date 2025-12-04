# Исправление подключения к базе данных в Koyeb

## ❌ Проблема

Ты ввел:
```
DATABASE_URL postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Ошибки:**
1. ❌ Нет знака `=` между `DATABASE_URL` и значением
2. ⚠️ Параметр `channel_binding=require` может вызывать проблемы

## ✅ Правильный формат

В Koyeb Dashboard → Environment Variables нужно добавить:

**Key:** `DATABASE_URL`

**Value:** 
```
postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**ИЛИ** (если первый вариант не работает, попробуй без `channel_binding`):
```
postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb
```

## 📝 Пошаговая инструкция

### 1. Зайди в Koyeb Dashboard
- Открой https://www.koyeb.com/apps
- Выбери свой app

### 2. Открой Environment Variables
- Найди раздел "Environment Variables" или "Secrets"
- Нажми "Add Variable" или "Edit"

### 3. Добавь/Исправь DATABASE_URL
- **Key:** `DATABASE_URL` (точно так, без пробелов)
- **Value:** `postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
- Сохрани

### 4. Проверь другие переменные
Убедись, что все переменные в формате `KEY=VALUE`:
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=твой-секрет`
- `CLOUDINARY_CLOUD_NAME=твой-cloud-name`
- и т.д.

### 5. Перезапусти приложение
- После изменения переменных окружения перезапусти app в Koyeb
- Или подожди автоматического перезапуска

## 🔍 Проверка подключения

### 1. Проверь логи в Koyeb
- Koyeb Dashboard → твой app → Logs
- Ищи ошибки типа:
  - `DATABASE_URL environment variable is required`
  - `could not connect to server`
  - `connection refused`

### 2. Проверь через API
Попробуй создать профиль через фронтенд или Swagger UI:
```
https://married-perl-dk-it1-106c0464.koyeb.app/docs
```

Если видишь ошибки подключения к БД, значит проблема в DATABASE_URL.

## 🚨 Частые проблемы

### Проблема: "DATABASE_URL environment variable is required"
**Решение:**
- Проверь, что переменная называется точно `DATABASE_URL` (без пробелов)
- Проверь, что есть знак `=` между ключом и значением
- Убедись, что переменная сохранена

### Проблема: "could not connect to server"
**Решение:**
1. Проверь, что URL скопирован полностью из Neon Dashboard
2. Убедись, что пароль правильный (может содержать специальные символы, которые нужно URL-encode)
3. Попробуй без `channel_binding=require`:
   ```
   postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### Проблема: "password authentication failed"
**Решение:**
- Проверь пароль в Neon Dashboard
- Если пароль содержит специальные символы, может потребоваться URL-encoding
- Попробуй сгенерировать новый пароль в Neon

### Проблема: "connection timeout"
**Решение:**
- Проверь, что Neon database не в sleep режиме (бесплатный план)
- Попробуй подключиться через Neon Dashboard → Connection String
- Убедись, что IP не заблокирован

## 📋 Полный список переменных для проверки

Убедись, что все переменные добавлены правильно:

```
DATABASE_URL=postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=твой-секрет-минимум-32-символа
CLOUDINARY_CLOUD_NAME=твой-cloud-name
CLOUDINARY_API_KEY=твой-api-key
CLOUDINARY_API_SECRET=твой-api-secret
CORS_ORIGINS=https://web.telegram.org,https://telegram.org
```

## ✅ После исправления

1. Сохрани переменные в Koyeb
2. Перезапусти app (или подожди автоматического перезапуска)
3. Проверь логи - не должно быть ошибок подключения к БД
4. Попробуй создать профиль через фронтенд
5. Проверь через Swagger UI: `/docs` → `POST /api/profiles/`

## 🔗 Полезные ссылки

- Koyeb Dashboard: https://www.koyeb.com/apps
- Neon Dashboard: https://console.neon.tech
- Как получить Neon Connection String: `HOW_TO_GET_NEON_DATABASE_URL.md`

