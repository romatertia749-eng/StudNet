# Команды для загрузки фронтенда на сервер

## 📦 Шаг 1: Сборка проекта (на локальном компьютере)

```bash
# Убедитесь, что .env настроен
cat .env
# Должно быть: REACT_APP_API_BASE_URL=https://rica-student-trusted-puzzle.trycloudflare.com

# Соберите проект
npm run build
```

Это создаст папку `build/` с готовыми файлами.

## 🚀 Шаг 2: Загрузка на сервер

### Вариант A: Через SCP (если есть SSH доступ)

```bash
# Загрузите папку build на сервер
# Замените root@your-server-ip на ваши данные
scp -r build/* root@your-server-ip:/var/www/frontend/

# Или если нужно создать директорию на сервере:
ssh root@your-server-ip "mkdir -p /var/www/frontend"
scp -r build/* root@your-server-ip:/var/www/frontend/
```

### Вариант B: Через Git (если проект в репозитории)

```bash
# 1. Закоммитьте изменения (если нужно)
git add .
git commit -m "Build for production"
git push origin main

# 2. На сервере
ssh root@your-server-ip
cd /var/www/frontend  # или где у вас проект
git pull origin main
npm install
npm run build
```

### Вариант C: Через SFTP (FileZilla, WinSCP и т.д.)

1. Подключитесь к серверу через SFTP
2. Загрузите содержимое папки `build/` в `/var/www/frontend/` на сервере

## ⚙️ Шаг 3: Настройка на сервере

### 1. Установите права на файлы

```bash
ssh root@your-server-ip

# Перейдите в директорию фронтенда
cd /var/www/frontend

# Установите права
chown -R www-data:www-data .
chmod -R 755 .
```

### 2. Настройте Nginx

Создайте или обновите конфигурацию nginx:

```bash
nano /etc/nginx/sites-available/frontend
```

Добавьте:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # или IP адрес

    root /var/www/frontend;
    index index.html;

    # Логи
    access_log /var/log/nginx/frontend_access.log;
    error_log /var/log/nginx/frontend_error.log;

    # Основная конфигурация
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кеширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Активируйте конфигурацию:

```bash
# Создайте симлинк (если нужно)
ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезагрузите nginx
systemctl reload nginx
```

### 3. Настройте SSL (опционально, через Let's Encrypt)

```bash
# Установите certbot (если еще не установлен)
apt-get update
apt-get install certbot python3-certbot-nginx

# Получите сертификат
certbot --nginx -d your-domain.com

# Автоматическое обновление
certbot renew --dry-run
```

## 🔄 Обновление фронтенда

Для обновления фронтенда:

```bash
# На локальном компьютере
npm run build

# Загрузите на сервер
scp -r build/* root@your-server-ip:/var/www/frontend/

# На сервере (если нужно)
ssh root@your-server-ip
cd /var/www/frontend
chown -R www-data:www-data .
systemctl reload nginx
```

## 📝 Быстрые команды (одной строкой)

### Полная загрузка и настройка:

```bash
# На локальном компьютере
npm run build && scp -r build/* root@your-server-ip:/var/www/frontend/ && ssh root@your-server-ip "cd /var/www/frontend && chown -R www-data:www-data . && chmod -R 755 . && systemctl reload nginx"
```

### Только загрузка:

```bash
npm run build && scp -r build/* root@your-server-ip:/var/www/frontend/
```

## ⚠️ Важно

1. **Переменные окружения встраиваются в build** - убедитесь, что `.env` настроен перед `npm run build`
2. **После изменения `.env` нужно пересобрать** проект
3. **Nginx должен быть настроен** для раздачи статических файлов
4. **Права на файлы** должны быть правильными (www-data:www-data)

## 🔍 Проверка

После загрузки проверьте:

```bash
# На сервере
curl http://localhost
# Или откройте в браузере ваш домен/IP
```

## 📚 Альтернатива: Развертывание через Vercel

Если не хотите настраивать nginx, используйте Vercel (см. `QUICK_DEPLOY.md`):

```bash
npm install -g vercel
vercel login
vercel --prod
```

Это автоматически развернет фронтенд с HTTPS и CDN.

