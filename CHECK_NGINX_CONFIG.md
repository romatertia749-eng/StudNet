# Проверка конфигурации Nginx

## Проблема
По адресу `https://rica-student-trusted-puzzle.trycloudflare.com` показывается фронтенд (градиент), но запросы к API не работают.

## Диагностика

### 1. Проверка health endpoint через туннель
```bash
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health
```
**Ожидается:** `{"status":"ok"}`

**Если возвращает HTML** - проблема с маршрутизацией в Nginx

### 2. Проверка API endpoint
```bash
curl -s -m 5 -I https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/
```
**Ожидается:** HTTP заголовки с `Content-Type: application/json` или ошибка 401/404

**Если возвращает HTML** - Nginx не проксирует `/api/*` на бэкенд

### 3. Проверка конфигурации Nginx на сервере
```bash
ssh root@155.212.170.255

# Проверьте конфигурацию
cat /etc/nginx/sites-enabled/default
# или
cat /etc/nginx/conf.d/*.conf
```

## Правильная конфигурация Nginx

```nginx
server {
    listen 80;
    server_name _;

    # ВАЖНО: API запросы должны быть ПЕРВЫМИ
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS заголовки (если нужно)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
        add_header Access-Control-Allow-Headers "*" always;
        
        # Обработка preflight запросов
        if ($request_method = OPTIONS) {
            return 204;
        }
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
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Исправление

### Если Nginx не проксирует API запросы:

```bash
ssh root@155.212.170.255

# 1. Создайте резервную копию
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup

# 2. Отредактируйте конфигурацию
nano /etc/nginx/sites-enabled/default

# 3. Убедитесь, что location /api/ идет ПЕРЕД location /
# Порядок важен! Более специфичные location должны быть первыми

# 4. Проверьте синтаксис
nginx -t

# 5. Перезагрузите Nginx
systemctl reload nginx

# 6. Проверьте
curl -s https://rica-student-trusted-puzzle.trycloudflare.com/health
```

## Проверка после исправления

```bash
# 1. Health endpoint
curl -s https://rica-student-trusted-puzzle.trycloudflare.com/health
# Должно вернуть: {"status":"ok"}

# 2. API endpoint (должен вернуть ошибку, но не HTML)
curl -s -I https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/
# Должен вернуть HTTP заголовки, не HTML

# 3. Проверка в браузере
# Откройте https://rica-student-trusted-puzzle.trycloudflare.com/health
# Должно показать: {"status":"ok"}
```

## Если проблема в Cloudflare Tunnel

Если Nginx настроен правильно, но запросы все равно не доходят до бэкенда, проблема может быть в конфигурации Cloudflare Tunnel.

Проверьте конфигурацию туннеля (если используется config.yml):
```yaml
tunnel: your-tunnel-id
credentials-file: /root/.cloudflared/credentials.json

ingress:
  # API запросы → Nginx (который проксирует на бэкенд)
  - hostname: rica-student-trusted-puzzle.trycloudflare.com
    service: http://localhost:80
  # Fallback
  - service: http_status:404
```

## Важно

1. **Порядок location блоков важен** - `/api/` должен быть ПЕРЕД `/`
2. **Проверьте, что бэкенд слушает на 127.0.0.1:8000**
3. **Проверьте логи Nginx** при ошибках: `tail -f /var/log/nginx/error.log`

