# Простые команды для загрузки на сервер

## 🎯 Быстрый способ

### 1. Соберите проект (на вашем компьютере)

```bash
npm run build
```

### 2. Загрузите на сервер

**Замените `root@your-server-ip` на ваш IP или домен сервера**

```bash
# Создайте директорию на сервере (если еще нет)
ssh root@your-server-ip "mkdir -p /var/www/frontend"

# Загрузите файлы
scp -r build/* root@your-server-ip:/var/www/frontend/
```

### 3. Настройте на сервере

```bash
# Подключитесь к серверу
ssh root@your-server-ip

# Установите права
cd /var/www/frontend
chown -R www-data:www-data .
chmod -R 755 .

# Настройте nginx (если еще не настроен)
nano /etc/nginx/sites-available/frontend
```

Вставьте в файл nginx:

```nginx
server {
    listen 80;
    server_name _;  # или ваш домен

    root /var/www/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Активируйте:

```bash
ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 🔄 Для обновления (одной командой)

```bash
npm run build && scp -r build/* root@your-server-ip:/var/www/frontend/
```

Затем на сервере:

```bash
ssh root@your-server-ip "cd /var/www/frontend && chown -R www-data:www-data . && systemctl reload nginx"
```

## 📝 Если используете другой путь на сервере

Если фронтенд должен быть в другой директории (например `/var/www/html` или `/home/user/frontend`), замените `/var/www/frontend` на нужный путь во всех командах.

