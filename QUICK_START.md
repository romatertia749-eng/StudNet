# 🚀 Быстрый старт

## Минимальные шаги для запуска приложения

### 1. База данных (5 минут)

```bash
# Установите PostgreSQL (если еще не установлен)
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql@15
# Linux: sudo apt install postgresql

# Создайте базу данных
psql -U postgres
CREATE DATABASE networking_app;
\q

# Создайте таблицы
psql -U postgres -d networking_app -f database/schema.sql
```

### 2. Бэкенд (10 минут)

```bash
cd backend_python

# Создайте виртуальное окружение
python -m venv venv

# Активируйте (Windows)
venv\Scripts\activate

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл (см. backend_python/ENV_EXPLANATION.md)
# DATABASE_URL=postgresql://user:password@localhost:5432/networking_app

# Запустите сервер
uvicorn app.main:app --reload --port 8080
```

### 3. Фронтенд (2 минуты)

```bash
# Установите зависимости
npm install

# Создайте .env файл
echo "REACT_APP_API_BASE_URL=http://localhost:8080" > .env

# Запустите
npm start
```

### 4. Telegram бот (5 минут)

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/newbot` - создайте бота
3. `/newapp` - создайте Web App
4. Укажите URL: `https://your-app.vercel.app` (после деплоя)

### 5. Деплой фронтенда

```bash
# Соберите проект
npm run build

# Загрузите на Vercel/Netlify
# Или используйте: npx vercel
```

## ✅ Готово!

Откройте бота в Telegram и запустите Web App.

---

📖 **Подробные инструкции:**
- `README.md` - основная документация
- `TELEGRAM_SETUP.md` - настройка Telegram
- `TELEGRAM_LAUNCH.md` - запуск в Telegram
- `backend_python/README.md` - документация бэкенда
- `backend_python/ENV_EXPLANATION.md` - переменные окружения

