# Автоматическое исправление конфигурации Nginx

## Что делает скрипт

1. Находит конфигурацию Nginx (в разных возможных местах)
2. Создает резервную копию
3. Добавляет или исправляет `location /api/` для проксирования на бэкенд
4. Добавляет `location /health` для health check
5. Проверяет синтаксис
6. Перезагружает Nginx

## Установка и запуск

### Вариант 1: Скачать и выполнить одной командой

```bash
ssh root@155.212.170.255

# Скачать скрипт
curl -o /tmp/fix_nginx_auto.sh https://raw.githubusercontent.com/your-repo/fix_nginx_auto.sh
# ИЛИ если у вас есть доступ к файлу локально:
# scp fix_nginx_auto.sh root@155.212.170.255:/tmp/

# Сделать исполняемым
chmod +x /tmp/fix_nginx_auto.sh

# Запустить
/tmp/fix_nginx_auto.sh
```

### Вариант 2: Создать скрипт прямо на сервере

```bash
ssh root@155.212.170.255

# Создать скрипт
cat > /tmp/fix_nginx_auto.sh << 'SCRIPT_EOF'
#!/bin/bash

echo "=== ПОИСК И ИСПРАВЛЕНИЕ КОНФИГУРАЦИИ NGINX ==="
echo ""

# Ищем конфигурацию Nginx
NGINX_CONFIG=""

# Проверяем разные места
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    NGINX_CONFIG="/etc/nginx/sites-enabled/default"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
elif [ -f "/etc/nginx/nginx.conf" ]; then
    if grep -q "include.*conf.d" /etc/nginx/nginx.conf; then
        NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
        if [ ! -f "$NGINX_CONFIG" ]; then
            mkdir -p /etc/nginx/conf.d
            touch "$NGINX_CONFIG"
        fi
    else
        NGINX_CONFIG="/etc/nginx/nginx.conf"
    fi
fi

if [ -z "$NGINX_CONFIG" ] || [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Конфигурация не найдена, создаем новую..."
    mkdir -p /etc/nginx/conf.d
    NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
    
    cat > "$NGINX_CONFIG" << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/studnet/public;
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF
    echo "✅ Создана новая конфигурация: $NGINX_CONFIG"
else
    echo "✅ Найдена конфигурация: $NGINX_CONFIG"
    BACKUP="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP"
    echo "✅ Создана резервная копия: $BACKUP"
    
    if ! grep -q "location /api/" "$NGINX_CONFIG"; then
        echo "Добавляем location /api/..."
        TEMP_FILE=$(mktemp)
        awk '
        /listen 80/ {
            print $0
            getline
            print $0
            print ""
            print "    location /api/ {"
            print "        proxy_pass http://127.0.0.1:8000;"
            print "        proxy_set_header Host $host;"
            print "        proxy_set_header X-Real-IP $remote_addr;"
            print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "        proxy_set_header X-Forwarded-Proto $scheme;"
            print "    }"
            print ""
            print "    location /health {"
            print "        proxy_pass http://127.0.0.1:8000;"
            print "        proxy_set_header Host $host;"
            print "        proxy_set_header X-Real-IP $remote_addr;"
            print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "        proxy_set_header X-Forwarded-Proto $scheme;"
            print "    }"
            print ""
            next
        }
        { print }
        ' "$NGINX_CONFIG" > "$TEMP_FILE"
        mv "$TEMP_FILE" "$NGINX_CONFIG"
    fi
fi

echo ""
echo "=== ПРОВЕРКА СИНТАКСИСА ==="
if nginx -t 2>&1; then
    echo "✅ Синтаксис правильный"
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
    echo ""
    echo "Проверка:"
    curl -s http://localhost/health
    echo ""
else
    echo "❌ Ошибка синтаксиса!"
    if [ -n "$BACKUP" ]; then
        cp "$BACKUP" "$NGINX_CONFIG"
        echo "✅ Восстановлено из резервной копии"
    fi
    exit 1
fi
SCRIPT_EOF

chmod +x /tmp/fix_nginx_auto.sh
/tmp/fix_nginx_auto.sh
```

## Что проверить после выполнения

```bash
# 1. Health endpoint
curl -s http://localhost/health
# Должно вернуть: {"status":"ok"}

# 2. API endpoint (должен вернуть ошибку API, не HTML)
curl -s -I http://localhost/api/profiles/ | head -3

# 3. Через туннель в браузере
# Откройте: https://rica-student-trusted-puzzle.trycloudflare.com/health
# Должно показать: {"status":"ok"}
```

## Если что-то пошло не так

Скрипт создает резервную копию перед изменениями. Восстановить:

```bash
# Найдите резервную копию
ls -lt /etc/nginx/conf.d/*.backup.* | head -1

# Восстановите
cp /etc/nginx/conf.d/default.conf.backup.YYYYMMDD_HHMMSS /etc/nginx/conf.d/default.conf
nginx -t
systemctl reload nginx
```


