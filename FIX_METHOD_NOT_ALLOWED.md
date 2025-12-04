# Исправление ошибки "Method not Allowed"

## Проблема
При создании профиля получаешь ошибку "Method not Allowed" (405).

## Причины и решения

### 1. Фронтенд использует старый URL (localhost)

**Проверь:**
- Открой DevTools (F12) → Console
- Должен быть лог: `API_BASE_URL: https://married-perl-dk-it1-106c0464.koyeb.app`
- Если видишь `API_BASE_URL: http://localhost:8080` → проблема в этом

**Решение:**
1. **Если деплоишь на Vercel/Netlify:**
   - Добавь переменную окружения `REACT_APP_API_BASE_URL=https://married-perl-dk-it1-106c0464.koyeb.app`
   - Пересобери проект

2. **Если запускаешь локально:**
   - Создай файл `.env` в корне проекта:
     ```
     REACT_APP_API_BASE_URL=https://married-perl-dk-it1-106c0464.koyeb.app
     ```
   - Перезапусти: `npm start`

### 2. CORS блокирует запрос

**Проверь в Koyeb:**
- Переменная `CORS_ORIGINS` должна содержать домен фронтенда
- Добавь: `CORS_ORIGINS=https://web.telegram.org,https://telegram.org,https://твой-фронтенд-url.com`

### 3. Проверь Network tab в DevTools

1. Открой DevTools (F12) → Network
2. Попробуй создать профиль
3. Найди запрос к `/api/profiles`
4. Проверь:
   - **Request URL**: должен быть `https://married-perl-dk-it1-106c0464.koyeb.app/api/profiles`
   - **Request Method**: должен быть `POST`
   - **Status Code**: что показывает? (405, 404, 500?)

### 4. Проверь логи в Koyeb

1. Зайди в Koyeb Dashboard → твой app → Logs
2. Попробуй создать профиль
3. Посмотри, что пишется в логах

### 5. Быстрая проверка API

Открой в браузере:
```
https://married-perl-dk-it1-106c0464.koyeb.app/docs
```

Найди endpoint `POST /api/profiles` и попробуй отправить тестовый запрос через Swagger UI.

## Что уже исправлено

1. ✅ Улучшен catch-all роут в `main.py` - теперь он точно не перехватывает POST запросы
2. ✅ Добавлены комментарии для ясности

## Следующие шаги

1. **Проверь URL во фронтенде** (самое вероятное)
2. **Проверь CORS настройки в Koyeb**
3. **Проверь логи в Koyeb Dashboard**
4. **Попробуй через Swagger UI** (`/docs`)

## Если ничего не помогает

Пришли:
- Скриншот Network tab (запрос к `/api/profiles`)
- Логи из Koyeb Dashboard
- Что показывает в Console браузера

