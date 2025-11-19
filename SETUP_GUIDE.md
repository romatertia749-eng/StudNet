# Полная инструкция по настройке приложения

## 📋 Содержание
1. [Настройка базы данных](#настройка-базы-данных)
2. [Настройка бэкенда](#настройка-бэкенда)
3. [Настройка фронтенда](#настройка-фронтенда)
4. [Интеграция с Telegram](#интеграция-с-telegram)
5. [Развертывание](#развертывание)

---

## 🗄️ Настройка базы данных

### Шаг 1: Установка PostgreSQL

**Windows:**
1. Скачайте PostgreSQL с [официального сайта](https://www.postgresql.org/download/windows/)
2. Установите PostgreSQL (запомните пароль для пользователя `postgres`)
3. PostgreSQL будет доступен на порту `5432`

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Шаг 2: Создание базы данных

Откройте терминал и выполните:

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных
CREATE DATABASE networking_app;

# Создайте пользователя (опционально, для production)
CREATE USER networking_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE networking_app TO networking_user;

# Выйдите из psql
\q
```

### Шаг 3: Создание таблиц

Выполните SQL скрипт из файла `database/schema.sql`:

```bash
psql -U postgres -d networking_app -f database/schema.sql
```

Или выполните SQL команды вручную (см. файл `database/schema.sql`)

---

## 🔧 Настройка бэкенда

### Требования
- Java 17 или выше
- Maven 3.6+ или Gradle 7+
- PostgreSQL 12+

### Шаг 1: Создание Spring Boot проекта

Если у вас еще нет проекта, создайте его через [Spring Initializr](https://start.spring.io/):

**Зависимости:**
- Spring Web
- Spring Data JPA
- PostgreSQL Driver
- Spring Boot Validation
- Lombok (опционально)

### Шаг 2: Настройка application.properties

Создайте файл `src/main/resources/application.properties`:

```properties
# База данных
spring.datasource.url=jdbc:postgresql://localhost:5432/networking_app
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Файловое хранилище
file.upload-dir=./uploads/photos
file.max-size=5242880
file.allowed-types=image/jpeg,image/png,image/webp

# Сервер
server.port=8080
server.servlet.context-path=/

# CORS (для разработки)
spring.web.cors.allowed-origins=http://localhost:3000,https://your-frontend-domain.com
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
spring.web.cors.allowed-headers=*
spring.web.cors.allow-credentials=true

# Логирование
logging.level.org.springframework.web=INFO
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### Шаг 3: Структура проекта

```
src/main/java/com/networking/
├── NetworkingApplication.java
├── controller/
│   └── ProfileController.java
│   └── MatchController.java
├── service/
│   └── ProfileService.java
│   └── MatchService.java
│   └── FileStorageService.java
├── repository/
│   └── ProfileRepository.java
│   └── SwipeRepository.java
│   └── MatchRepository.java
├── model/
│   └── Profile.java
│   └── Swipe.java
│   └── Match.java
└── dto/
    └── ProfileRequest.java
    └── ProfileResponse.java
    └── LikeRequest.java
    └── MatchResponse.java
```

### Шаг 4: Основные классы

См. примеры кода в файле `BACKEND_IMPLEMENTATION.md`

### Шаг 5: Запуск бэкенда

```bash
# Maven
./mvnw spring-boot:run

# Или через IDE
# Запустите NetworkingApplication.java
```

Бэкенд будет доступен на `http://localhost:8080`

---

## 🎨 Настройка фронтенда

### Шаг 1: Установка зависимостей

```bash
npm install
```

### Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_TELEGRAM_BOT_NAME=your_bot_name
```

### Шаг 3: Запуск в режиме разработки

```bash
npm start
```

Приложение откроется на `http://localhost:3000`

### Шаг 4: Сборка для production

```bash
npm run build
```

---

## 🤖 Интеграция с Telegram

### Шаг 1: Создание бота в Telegram

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и создайте бота
4. Сохраните токен бота (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Шаг 2: Настройка Web App

1. Отправьте команду `/newapp` боту @BotFather
2. Выберите вашего бота из списка
3. Укажите название приложения
4. Загрузите иконку (512x512px, PNG)
5. Укажите описание
6. Укажите URL вашего фронтенда (например: `https://your-app.vercel.app`)
7. Сохраните полученную ссылку на Web App

### Шаг 3: Тестирование в Telegram

1. Откройте вашего бота в Telegram
2. Нажмите на кнопку "Menu" или отправьте команду `/start`
3. Нажмите на кнопку с вашим Web App
4. Приложение должно открыться внутри Telegram

### Шаг 4: Получение данных пользователя

Telegram автоматически передает данные пользователя через `window.Telegram.WebApp.initDataUnsafe.user`:

```javascript
{
  id: 123456789,
  first_name: "Иван",
  last_name: "Иванов",
  username: "ivan_ivanov",
  language_code: "ru"
}
```

---

## 🚀 Развертывание

### Фронтенд (Vercel)

1. Зарегистрируйтесь на [Vercel](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Настройте переменные окружения:
   - `REACT_APP_API_BASE_URL` = `https://your-backend.com`
4. Деплой произойдет автоматически

### Фронтенд (Netlify)

1. Зарегистрируйтесь на [Netlify](https://netlify.com)
2. Подключите репозиторий
3. Настройки сборки:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Добавьте переменные окружения в настройках

### Бэкенд (Heroku)

1. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Создайте приложение:
   ```bash
   heroku create your-app-name
   ```
3. Добавьте PostgreSQL:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
4. Настройте переменные окружения:
   ```bash
   heroku config:set SPRING_DATASOURCE_URL=jdbc:postgresql://...
   ```
5. Деплой:
   ```bash
   git push heroku main
   ```

### Бэкенд (VPS)

1. Подключитесь к серверу по SSH
2. Установите Java, Maven, PostgreSQL
3. Клонируйте репозиторий
4. Настройте `application.properties`
5. Запустите:
   ```bash
   nohup java -jar networking-app.jar > app.log 2>&1 &
   ```

---

## ✅ Проверка работоспособности

### 1. Проверка базы данных

```bash
psql -U postgres -d networking_app -c "SELECT COUNT(*) FROM profiles;"
```

### 2. Проверка бэкенда

```bash
curl http://localhost:8080/api/profiles?userId=123456
```

### 3. Проверка фронтенда

Откройте `http://localhost:3000` в браузере

### 4. Проверка в Telegram

Откройте бота в Telegram и запустите Web App

---

## 🔒 Безопасность

### Production настройки

1. **CORS**: Ограничьте разрешенные домены
2. **HTTPS**: Используйте только HTTPS в production
3. **Валидация**: Проверяйте все входящие данные
4. **Rate Limiting**: Добавьте ограничение запросов
5. **Аутентификация**: Добавьте JWT токены для production

### Переменные окружения

Никогда не коммитьте:
- Пароли от БД
- API ключи
- Токены ботов
- Секретные ключи

Используйте `.env` файлы и `.gitignore`

---

## 🐛 Решение проблем

### Проблема: БД не подключается

**Решение:**
- Проверьте, что PostgreSQL запущен
- Проверьте правильность пароля в `application.properties`
- Проверьте, что база данных создана

### Проблема: CORS ошибки

**Решение:**
- Добавьте ваш фронтенд домен в `spring.web.cors.allowed-origins`
- Проверьте, что заголовки правильные

### Проблема: Telegram Web App не работает

**Решение:**
- Убедитесь, что используете HTTPS
- Проверьте, что скрипт Telegram подключен в `index.html`
- Проверьте консоль браузера на ошибки

### Проблема: Фото не загружаются

**Решение:**
- Проверьте права на папку `uploads/photos`
- Проверьте размер файла (макс. 5MB)
- Проверьте формат файла (JPG, PNG, WebP)

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи бэкенда
2. Проверьте консоль браузера (F12)
3. Проверьте Network tab в DevTools
4. Убедитесь, что все сервисы запущены

---

## 📚 Дополнительные ресурсы

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)

