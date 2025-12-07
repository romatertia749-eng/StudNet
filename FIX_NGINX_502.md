# Исправление ошибки 502 Bad Gateway

## 🔍 Проблема:

Nginx не может подключиться к бэкенду. Бэкенд работает на порту **8000**, а nginx может быть настроен на другой порт.

## ✅ Решение:

### 1. Проверьте конфигурацию nginx:

```bash
ssh root@155.212.170.255
cat /etc/nginx/sites-enabled/* | grep -A 10 -B 5 "proxy_pass\|8000\|8080"
```

Или найдите конфигурацию для studnet:

```bash
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/studnet
# или
cat /etc/nginx/sites-enabled/default
```

### 2. Исправьте конфигурацию nginx:

Нужно, чтобы nginx проксировал на `http://127.0.0.1:8000` (где работает бэкенд).

```bash
nano /etc/nginx/sites-enabled/studnet
# или
nano /etc/nginx/sites-enabled/default
```

Найдите блок с `proxy_pass` и исправьте на:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Или если весь сайт проксируется:

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Проверьте конфигурацию:

```bash
nginx -t
```

Если ошибок нет, перезагрузите:

```bash
systemctl reload nginx
```

### 4. Проверьте доступность бэкенда:

```bash
# Проверьте, что бэкенд доступен на порту 8000
curl http://127.0.0.1:8000/health

# Проверьте через nginx
curl http://localhost/api/health
# или
curl http://localhost/health
```

## 🔧 Полная диагностика:

```bash
echo "=== КОНФИГУРАЦИЯ NGINX ==="
cat /etc/nginx/sites-enabled/* | grep -A 5 "proxy_pass"
echo ""

echo "=== ДОСТУПНОСТЬ БЭКЕНДА ==="
curl -s http://127.0.0.1:8000/health || echo "Бэкенд недоступен"
echo ""

echo "=== СТАТУС NGINX ==="
systemctl status nginx --no-pager | head -5
echo ""

echo "=== ЛОГИ NGINX (последние ошибки) ==="
tail -10 /var/log/nginx/error.log
```

## 📋 Типичная конфигурация для studnet:

```nginx
server {
    listen 80;
    server_name _;

    # Статические файлы фронтенда
    root /var/www/studnet/public;
    index index.html;

    # API проксирование на бэкенд
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

