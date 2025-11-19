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
# Создайте Spring Boot проект через https://start.spring.io/
# Добавьте зависимости: Web, JPA, PostgreSQL, Validation

# Скопируйте код из BACKEND_IMPLEMENTATION.md

# Настройте application.properties:
spring.datasource.url=jdbc:postgresql://localhost:5432/networking_app
spring.datasource.username=postgres
spring.datasource.password=ваш_пароль

# Запустите
./mvnw spring-boot:run
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
- `SETUP_GUIDE.md` - полная инструкция по настройке
- `TELEGRAM_SETUP.md` - настройка Telegram
- `BACKEND_IMPLEMENTATION.md` - примеры кода бэкенда
- `BACKEND_TASK.md` - техническое задание для бэкенда

