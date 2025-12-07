# Отладка 502 Bad Gateway

## ✅ Конфигурация nginx правильная!

Проксирование настроено на `http://127.0.0.1:8000` - это правильно.

## 🔍 Проверки:

### 1. Проверьте, работает ли бэкенд:

```bash
curl http://127.0.0.1:8000/health
```

Должен вернуться: `{"status":"ok","database":"connected","time":"0.02s"}`

### 2. Проверьте логи nginx:

```bash
tail -20 /var/log/nginx/error.log
```

Посмотрите, какая именно ошибка там.

### 3. Проверьте доступность через nginx:

```bash
curl http://localhost/api/health
curl -v http://localhost/api/health
```

### 4. Проверьте статус бэкенда:

```bash
systemctl status studnet-backend.service
ps aux | grep gunicorn | grep -v grep
```

## 🔧 Возможные исправления:

### Если бэкенд не отвечает:

```bash
# Перезапустите бэкенд
systemctl restart studnet-backend.service
systemctl status studnet-backend.service
```

### Если нужно добавить таймауты в nginx:

Добавьте в location /api/:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### Если проблема с подключением:

Проверьте, что бэкенд слушает на 127.0.0.1, а не только на другом интерфейсе.

