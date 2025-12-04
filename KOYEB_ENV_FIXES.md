# Исправления переменных окружения в Koyeb

## ✅ Что уже работает

Приложение запустилось успешно:
- ✅ Health checks проходят
- ✅ `/health` возвращает 200 OK
- ✅ `/docs` работает
- ✅ DATABASE_URL подключен (приложение запустилось без ошибок)

## 🔧 Что нужно исправить

### 1. DATABASE_URL - убрать channel_binding

**Текущее значение:**
```
postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Исправленное значение:**
```
postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Почему:** Параметр `channel_binding=require` может вызывать проблемы с некоторыми драйверами PostgreSQL.

### 2. CORS_ORIGINS - добавить FRONTEND_URL

**Текущее значение:**
```
https://web.telegram.org,https://telegram.org
```

**Исправленное значение:**
```
https://web.telegram.org,https://telegram.org,https://stud-net.vercel.app
```

**Почему:** Нужно добавить домен фронтенда для CORS запросов.

**Примечание:** Код автоматически добавляет `FRONTEND_URL` в allowed_origins, но лучше добавить явно в `CORS_ORIGINS` для ясности.

### 3. CLOUDINARY_URL - уже поддерживается ✅

Код теперь поддерживает `CLOUDINARY_URL` (после обновления). Текущее значение корректно:
```
cloudinary://449518368291491:M89qukWejrlsUEU17STU5-EIFDo@ddvojapxs
```

## 📝 Итоговый список переменных

```
DATABASE_URL=postgresql://neondb_owner:npg_O5nmXKtzQl7P@ep-icy-voice-ago4k94t.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

CLOUDINARY_URL=cloudinary://449518368291491:M89qukWejrlsUEU17STU5-EIFDo@ddvojapxs

CORS_ORIGINS=https://web.telegram.org,https://telegram.org,https://stud-net.vercel.app

FRONTEND_URL=https://stud-net.vercel.app

JWT_SECRET=jTOAbIQpMlvh_oKIVSAdYwIytGynkyo_6dtCLPLHLy0

TELEGRAM_BOT_TOKEN=8282153203:AAEFZSTuQna3U7wJ_Yi9PgWuaumZAAAi22w
```

## 🚀 Что сделать

1. **Обнови DATABASE_URL** - убери `&channel_binding=require`
2. **Обнови CORS_ORIGINS** - добавь `https://stud-net.vercel.app`
3. **Закоммить изменения в коде** (поддержка CLOUDINARY_URL):
   ```bash
   git add backend_python/app/services/file_storage.py backend_python/app/main.py
   git commit -m "Add CLOUDINARY_URL support and improve CORS"
   git push
   ```
4. **Перезапустить app в Koyeb** (или подождать автоматического перезапуска)

## ✅ После исправления

1. Проверь логи - не должно быть ошибок
2. Попробуй создать профиль через фронтенд
3. Проверь загрузку фото - должно работать с CLOUDINARY_URL

