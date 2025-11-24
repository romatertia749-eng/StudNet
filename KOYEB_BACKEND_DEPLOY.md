# Полный гайд: деплой FastAPI бэкенда на Koyeb

## Что такое Koyeb
Koyeb — серверless-платформа, которая даёт бесплатный always-on инстанс (1 shared vCPU, 512 MB RAM) без привязки карты. Есть авто HTTPS, autodeploy из GitHub, никаких cold start.

---
## Требования
- Репозиторий в GitHub
- Аккаунт на [koyeb.com](https://www.koyeb.com)

---
## Шаг 1: Регистрация
1. Перейдите на koyeb.com
2. Нажмите **Sign up**
3. Зарегистрируйтесь через GitHub (рекомендуется) или email
4. Подтвердите аккаунт

---
## Шаг 2: Подготовка проекта
В папке `backend_python` должны быть:
- `app/main.py`
- `requirements.txt`
- (опционально) `Procfile` или `Dockerfile`

Koyeb использует Nixpacks, поэтому Docker не обязателен.

---
## Шаг 3: Создание сервиса
1. В Koyeb Dashboard нажмите **Create Service**
2. Источник: **GitHub Repository**
3. Подключите репозиторий и выберите ветку (например, `main`)
4. В разделе **Settings** заполните:
   - **Name**: `studnet-backend`
   - **Region**: ближайший (например, `par`)
   - **Instance type**: `Nano (Free)`
   - **Deployment**: `Nixpacks`
   - **Root directory**: `backend_python`
   - **Run command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

> Root directory критичен. Если указать корень репо, Koyeb попытается собрать фронтенд.

---
## Шаг 4: Переменные окружения
Добавьте в разделе **Environment Variables**:

| KEY | VALUE |
| --- | --- |
| `DATABASE_URL` | URL вашей базы (Railway/Neon/Render и т.д.) |
| `FRONTEND_URL` | `https://stud-net.vercel.app` |
| `CORS_ORIGINS` | `https://stud-net.vercel.app,https://web.telegram.org` |
| `UPLOAD_DIR` | `./uploads/photos` |
| `MAX_FILE_SIZE` | `5242880` |
| `JWT_SECRET` | `your-secret-key` |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` (если нужно) |

Нажмите **Deploy**. Koyeb установит зависимости и запустит `uvicorn`.

---
## Шаг 5: Проверка
После деплоя появится URL вида `https://studnet-backend-xxxx.koyeb.app`.

Проверьте эндпоинты:
```
https://...koyeb.app/health  -> {"status":"ok"}
https://...koyeb.app/        -> {"message":"Networking App API"}
```
Если открывается HTML — проверьте Root directory.

---
## Шаг 6: Настроить фронтенд (Vercel)
1. Vercel → Settings → Environment Variables
2. `REACT_APP_API_BASE_URL = https://...koyeb.app`
3. Redeploy (или новый push)

---
## Шаг 7: Миграции
Если база пустая, выполните SQL из `database/schema.sql` в вашей внешней БД (Railway/Neon и т.д.).

---
## Шаг 8: Логи и обновления
- Логи: Service → Logs
- Перезапуск: Service → Deployments → Restart
- Обновления: Koyeb деплоит при каждом push

---
## Частые проблемы
1. Сервис собирает фронтенд — проверьте Root directory = `backend_python`.
2. Dependency error — убедитесь, что `requirements.txt` лежит в `backend_python`.
3. Cannot connect to DB — проверьте `DATABASE_URL` и доступ к базе.
4. CORS — `CORS_ORIGINS` без пробелов, только запятая.

---
## Чеклист
- [ ] Репозиторий подключён к Koyeb
- [ ] Root directory = `backend_python`
- [ ] Run command = `uvicorn ...` задан
- [ ] Переменные окружения заданы
- [ ] `/health` отвечает JSON-ом
- [ ] Vercel переменная обновлена
- [ ] Telegram WebApp обращается к API

Готово! FastAPI бэкенд запущен на Koyeb без привязки карты и без cold start.
# РџРѕР»РЅС‹Р№ РіР°Р№Рґ: РґРµРїР»РѕР№ FastAPI Р±СЌРєРµРЅРґР° РЅР° Koyeb

## Р§С‚Рѕ С‚Р°РєРѕРµ Koyeb
Koyeb вЂ” СЃРµСЂРІРµСЂless-РїР»Р°С‚С„РѕСЂРјР°, РєРѕС‚РѕСЂР°СЏ РґР°С‘С‚ Р±РµСЃРїР»Р°С‚РЅС‹Р№ always-on РёРЅСЃС‚Р°РЅСЃ (1 shared vCPU, 512 MB RAM) Р±РµР· РїСЂРёРІСЏР·РєРё РєР°СЂС‚С‹. Р•СЃС‚СЊ Р°РІС‚Рѕ HTTPS, autodeploy РёР· GitHub, РЅРёРєР°РєРёС… cold start.

---
## РўСЂРµР±РѕРІР°РЅРёСЏ
- Р РµРїРѕР·РёС‚РѕСЂРёР№ РІ GitHub
- РђРєРєР°СѓРЅС‚ РЅР° [koyeb.com](https://www.koyeb.com)

---
## РЁР°Рі 1: Р РµРіРёСЃС‚СЂР°С†РёСЏ
1. РџРµСЂРµР№РґРёС‚Рµ РЅР° koyeb.com
2. РќР°Р¶РјРёС‚Рµ **Sign up**
3. Р—Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№С‚РµСЃСЊ С‡РµСЂРµР· GitHub (СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ) РёР»Рё email
4. РџРѕРґС‚РІРµСЂРґРёС‚Рµ Р°РєРєР°СѓРЅС‚

---
## РЁР°Рі 2: РџРѕРґРіРѕС‚РѕРІРєР° РїСЂРѕРµРєС‚Р°
Р’ РїР°РїРєРµ `backend_python` РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ:
- `app/main.py`
- `requirements.txt`
- (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ) `Procfile` РёР»Рё `Dockerfile`

Koyeb РёСЃРїРѕР»СЊР·СѓРµС‚ Nixpacks, РїРѕСЌС‚РѕРјСѓ Docker РЅРµ РѕР±СЏР·Р°С‚РµР»РµРЅ.

---
## РЁР°Рі 3: РЎРѕР·РґР°РЅРёРµ СЃРµСЂРІРёСЃР°
1. Р’ Koyeb Dashboard РЅР°Р¶РјРёС‚Рµ **Create Service**
2. РСЃС‚РѕС‡РЅРёРє: **GitHub Repository**
3. РџРѕРґРєР»СЋС‡РёС‚Рµ СЂРµРїРѕР·РёС‚РѕСЂРёР№ Рё РІС‹Р±РµСЂРёС‚Рµ РІРµС‚РєСѓ (РЅР°РїСЂРёРјРµСЂ, main)
4. Р’ СЂР°Р·РґРµР»Рµ **Settings** СѓРєР°Р¶РёС‚Рµ:
   - **Name**: `studnet-backend`
   - **Region**: Р±Р»РёР¶Р°Р№С€РёР№ (РЅР°РїСЂРёРјРµСЂ, `par` вЂ” РџР°СЂРёР¶)
   - **Instance type**: `Nano` (free)
   - **Deployment mode**: `Nixpacks`
   - **Root directory**: `backend_python`
   - **Build command**: РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РїСѓСЃС‚С‹Рј (Nixpacks РЅР°Р№РґС‘С‚ requirements)
   - **Run command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

> Root directory РєСЂРёС‚РёС‡РµРЅ. Р•СЃР»Рё СѓРєР°Р·Р°С‚СЊ РєРѕСЂРµРЅСЊ СЂРµРїРѕ, Koyeb РїРѕРїС‹С‚Р°РµС‚СЃСЏ СЃРѕР±СЂР°С‚СЊ С„СЂРѕРЅС‚РµРЅРґ.

---
## РЁР°Рі 4: РџРµСЂРµРјРµРЅРЅС‹Рµ РѕРєСЂСѓР¶РµРЅРёСЏ
1. Р’ СЂР°Р·РґРµР»Рµ **Environment variables** РґРѕР±Р°РІСЊС‚Рµ:

| KEY             | VALUE                                                     |
|-----------------|-----------------------------------------------------------|
| `DATABASE_URL`  | URL РІР°С€РµР№ Р±Р°Р·С‹ (Railway/Neon/Render Рё С‚.Рґ.)               |
| `FRONTEND_URL`  | `https://stud-net.vercel.app`                              |
| `CORS_ORIGINS`  | `https://stud-net.vercel.app,https://web.telegram.org`     |
| `UPLOAD_DIR`    | `./uploads/photos`                                        |
| `MAX_FILE_SIZE` | `5242880`                                                |
| `JWT_SECRET`    | `your-secret-key`                                        |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` (РµСЃР»Рё РЅСѓР¶РЅРѕ)                        |

2. РќР°Р¶РјРёС‚Рµ **Deploy**. Koyeb СѓСЃС‚Р°РЅРѕРІРёС‚ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё Рё Р·Р°РїСѓСЃС‚РёС‚ `uvicorn`.

---
## РЁР°Рі 5: РџСЂРѕРІРµСЂРєР°
РџРѕСЃР»Рµ РґРµРїР»РѕСЏ Koyeb РІС‹РґР°С‘С‚ URL РІРёРґР° `https://studnet-backend-xxxx.koyeb.app`.

РџСЂРѕРІРµСЂСЊС‚Рµ СЌРЅРґРїРѕРёРЅС‚С‹:
```
https://...koyeb.app/health  -> {"status":"ok"}
https://...koyeb.app/        -> {"message":"Networking App API"}
```

Р•СЃР»Рё РІРёРґРёС‚Рµ HTML вЂ” СЃРєРѕСЂРµРµ РІСЃРµРіРѕ СѓРєР°Р·Р°РЅ РЅРµРїСЂР°РІРёР»СЊРЅС‹Р№ Root Directory.

---
## РЁР°Рі 6: РќР°СЃС‚СЂРѕРёС‚СЊ С„СЂРѕРЅС‚РµРЅРґ (Vercel)
1. Vercel в†’ Settings в†’ Environment Variables
2. `REACT_APP_API_BASE_URL = https://...koyeb.app`
3. РЎРґРµР»Р°Р№С‚Рµ Redeploy (РёР»Рё РЅРѕРІС‹Р№ push)

---
## РЁР°Рі 7: РњРёРіСЂР°С†РёРё
Р•СЃР»Рё Р±Р°Р·Р° РїСѓСЃС‚Р°СЏ, РІС‹РїРѕР»РЅРёС‚Рµ SQL РёР· `database/schema.sql` РІ РІР°С€РµР№ Р‘Р” (Railway/Neon Рё С‚.Рґ.). Koyeb СЃР°Рј Postgres РЅРµ РІС‹РґР°С‘С‚, РЅРѕ РѕС‚Р»РёС‡РЅРѕ СЂР°Р±РѕС‚Р°РµС‚ СЃ РІРЅРµС€РЅРёРјРё Р‘Р”.

---
## РЁР°Рі 8: Р›РѕРіРё Рё РѕР±РЅРѕРІР»РµРЅРёСЏ
- Р›РѕРіРё: Service в†’ Logs
- РџРµСЂРµР·Р°РїСѓСЃРє: Service в†’ Deployments в†’ Restart
- РћР±РЅРѕРІР»РµРЅРёРµ РєРѕРґР°: Koyeb Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РґРµРїР»РѕРёС‚ РїСЂРё РєР°Р¶РґРѕРј push РІ РІС‹Р±СЂР°РЅРЅСѓСЋ РІРµС‚РєСѓ

---
## Р§Р°СЃС‚С‹Рµ РїСЂРѕР±Р»РµРјС‹
1. **РЎРµСЂРІРёСЃ СЃРѕР±РёСЂР°РµС‚ С„СЂРѕРЅС‚РµРЅРґ** вЂ” СѓР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ `Root directory = backend_python`.
2. **Dependency error** вЂ” РїСЂРѕРІРµСЂСЊС‚Рµ `requirements.txt` РІ СЌС‚РѕР№ РїР°РїРєРµ.
3. **Cannot connect to DB** вЂ” РїСЂРѕРІРµСЂСЊС‚Рµ `DATABASE_URL`, РѕС‚РєСЂРѕР№С‚Рµ РґРѕСЃС‚СѓРї Рє Р‘Р”.
4. **CORS** вЂ” РєРѕСЂСЂРµРєС‚РЅРѕ Р·Р°РїРѕР»РЅРёС‚Рµ `CORS_ORIGINS`, Р±РµР· РїСЂРѕР±РµР»РѕРІ РєСЂРѕРјРµ Р·Р°РїСЏС‚РѕР№.

---
## Р§РµРєР»РёСЃС‚
- [ ] Р РµРїРѕР·РёС‚РѕСЂРёР№ РїРѕРґРєР»СЋС‡С‘РЅ Рє Koyeb
- [ ] Root directory = `backend_python`
- [ ] `uvicorn app.main:app` СѓРєР°Р·Р°РЅ РєР°Рє Run Command
- [ ] РџРµСЂРµРјРµРЅРЅС‹Рµ РѕРєСЂСѓР¶РµРЅРёСЏ Р·Р°РґР°РЅС‹
- [ ] `/health` РѕС‚РІРµС‡Р°РµС‚ JSON-РѕРј
- [ ] Vercel РїРµСЂРµРјРµРЅРЅР°СЏ РѕР±РЅРѕРІР»РµРЅР°
- [ ] Telegram WebApp РѕР±С‰Р°РµС‚СЃСЏ СЃ API

Р“РѕС‚РѕРІРѕ! РўРµРїРµСЂСЊ Сѓ РІР°СЃ СЂР°Р±РѕС‚Р°РµС‚ FastAPI Р±СЌРєРµРЅРґ РЅР° Koyeb Р±РµР· РїСЂРёРІСЏР·РєРё РєР°СЂС‚С‹ Рё Р±РµР· cold start.
