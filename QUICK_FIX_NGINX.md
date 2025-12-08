# Быстрое исправление маршрутизации

## Проблема
По адресу `https://rica-student-trusted-puzzle.trycloudflare.com` показывается фронтенд, но API запросы не работают.

## Быстрая проверка

### 1. Проверьте health endpoint в браузере
Откройте: `https://rica-student-trusted-puzzle.trycloudflare.com/health`

**Должно показать:** `{"status":"ok"}`

**Если показывает HTML или ошибку 404** - Nginx не проксирует запросы на бэкенд.

### 2. Проверьте на сервере

```bash
ssh root@155.212.170.255

# Проверьте health напрямую (должно работать)
curl -s http://127.0.0.1:8000/health

# Проверьте через Nginx (может не работать)
curl -s http://localhost/health

# Проверьте конфигурацию Nginx
cat /etc/nginx/sites-enabled/default | grep -A 10 "location /api"
```

## Исправление конфигурации Nginx

```bash
ssh root@155.212.170.255

# 1. Создайте резервную копию
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.$(date +%Y%m%d_%H%M%S)

# 2. Отредактируйте конфигурацию
nano /etc/nginx/sites-enabled/default
```

### Правильная конфигурация:

```nginx
server {
    listen 80;
    server_name _;

    # ВАЖНО: API запросы ПЕРВЫМИ (до location /)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check → бэкенд
    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Все остальное → фронтенд
    location / {
        root /var/www/studnet/public;
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Проверьте и перезагрузите

```bash
# Проверьте синтаксис
nginx -t

# Если OK, перезагрузите
systemctl reload nginx

# Проверьте
curl -s http://localhost/health
# Должно вернуть: {"status":"ok"}
```

### 4. Проверьте через туннель

В браузере откройте:
- `https://rica-student-trusted-puzzle.trycloudflare.com/health` → должно быть `{"status":"ok"}`
- `https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/` → должна быть ошибка API, но не HTML

## Если не помогло

### Проверьте логи Nginx:
```bash
tail -50 /var/log/nginx/error.log
```

### Проверьте, что бэкенд слушает:
```bash
ss -tulpn | grep :8000
# или
netstat -tulpn | grep :8000
```

### Проверьте статус бэкенда:
```bash
systemctl status studnet-backend.service
```

## Альтернатива: исправить через скрипт

Если хотите автоматически исправить конфигурацию:

```bash
ssh root@155.212.170.255

# Скачайте и выполните скрипт
cat > /tmp/fix_nginx.sh << 'EOF'
#!/bin/bash
CONFIG="/etc/nginx/sites-enabled/default"
BACKUP="${CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Создаем резервную копию
cp "$CONFIG" "$BACKUP"

# Проверяем, есть ли уже location /api/
if grep -q "location /api/" "$CONFIG"; then
    echo "Location /api/ уже существует"
else
    echo "Добавляем location /api/..."
    # Создаем временный файл с правильной конфигурацией
    # (нужно вручную отредактировать)
    echo "Пожалуйста, отредактируйте конфигурацию вручную:"
    echo "nano $CONFIG"
fi
EOF

chmod +x /tmp/fix_nginx.sh
/tmp/fix_nginx.sh
```

Но лучше отредактировать вручную, чтобы убедиться, что все правильно.

