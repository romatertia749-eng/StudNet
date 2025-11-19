# Интеграция с Telegram Mini App

## Что добавлено

1. **Валидация initData на бэкенде** (`app/auth.py`)
   - Проверка подписи Telegram
   - Проверка свежести данных (не старше 5 минут)
   - Извлечение данных пользователя

2. **JWT аутентификация**
   - Генерация JWT токенов после валидации
   - Middleware для защиты эндпоинтов

3. **Эндпоинт аутентификации** (`/api/auth`)
   - Принимает initData от фронтенда
   - Возвращает JWT токен

4. **Обновленный WebAppContext**
   - Автоматическая отправка initData на бэкенд
   - Сохранение JWT токена в localStorage
   - Использование токена для всех запросов

## Настройка

### 1. Создай бота в BotFather

1. Открой Telegram, найди `@BotFather`
2. Команда `/newbot` — создай бота
3. Сохрани **токен бота**
4. Команда `/newapp` — создай Mini App
5. Укажи URL приложения (пока можно оставить пустым, обновишь после деплоя)

### 2. Настрой бэкенд

Создай файл `.env` в папке `backend_python`:

```env
TELEGRAM_BOT_TOKEN=твой_токен_от_BotFather
JWT_SECRET=твой-секретный-ключ-измени-в-продакшене
DATABASE_URL=postgresql://postgres:!Miha596169@localhost:5432/networking_app
```

Установи PyJWT (если еще не установлен):
```bash
cd backend_python
.\venv\Scripts\pip.exe install PyJWT
```

### 3. Перезапусти бэкенд

```bash
cd backend_python
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8080
```

## Как это работает

1. **При открытии приложения в Telegram:**
   - Фронтенд получает `initData` от Telegram
   - Отправляет его на `/api/auth` с заголовком `Authorization: tma <initData>`
   - Бэкенд валидирует данные и возвращает JWT токен
   - Токен сохраняется в localStorage

2. **При запросах к API:**
   - Фронтенд автоматически добавляет заголовок `Authorization: Bearer <token>`
   - Бэкенд проверяет токен и извлекает user_id

## Тестирование локально

Для тестирования без Telegram используй моковые данные (уже настроено в `WebAppContext`).

Для тестирования с реальным Telegram используй ngrok:

```bash
# Установи ngrok
# Запусти бэкенд на порту 8080
# В другом терминале:
ngrok http 8080

# Скопируй URL (например: https://abc123.ngrok.io)
# Обнови URL в BotFather: /myapps -> Edit Web App URL
```

## Безопасность

✓ initData валидируется на бэкенде (никогда не доверяй фронтенду)
✓ Проверяется свежесть данных (не старше 5 минут)
✓ JWT токены имеют срок действия (7 дней)
✓ TELEGRAM_BOT_TOKEN хранится только в .env

## Следующие шаги

1. Добавь защиту эндпоинтов через `get_current_user_id` dependency
2. Обнови запросы в `Profiles.jsx` для использования `fetchWithAuth`
3. Настрой деплой на продакшен

