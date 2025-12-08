#!/bin/bash

echo "=== ПОИСК КОНФИГУРАЦИИ NGINX ==="

# Ищем конфигурацию Nginx
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    NGINX_CONFIG="/etc/nginx/sites-enabled/default"
elif [ -f "/etc/nginx/nginx.conf" ]; then
    NGINX_CONFIG="/etc/nginx/nginx.conf"
elif [ -d "/etc/nginx/conf.d" ]; then
    NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
    if [ ! -f "$NGINX_CONFIG" ]; then
        # Ищем любой .conf файл в conf.d
        NGINX_CONFIG=$(find /etc/nginx/conf.d -name "*.conf" | head -1)
    fi
fi

if [ -z "$NGINX_CONFIG" ]; then
    echo "❌ Конфигурация Nginx не найдена!"
    echo "Ищем все возможные файлы..."
    find /etc/nginx -name "*.conf" -type f 2>/dev/null
    exit 1
fi

echo "✅ Найдена конфигурация: $NGINX_CONFIG"

# Создаем резервную копию
BACKUP="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP"
echo "✅ Создана резервная копия: $BACKUP"

# Проверяем, есть ли уже location /api/
if grep -q "location /api/" "$NGINX_CONFIG"; then
    echo "⚠️  Location /api/ уже существует, проверяем правильность..."
    
    # Проверяем, проксирует ли он на бэкенд
    if grep -A 5 "location /api/" "$NGINX_CONFIG" | grep -q "proxy_pass.*8000"; then
        echo "✅ Location /api/ правильно настроен"
    else
        echo "⚠️  Location /api/ существует, но не проксирует на порт 8000"
        echo "Нужно исправить вручную"
    fi
else
    echo "❌ Location /api/ не найден, добавляем..."
    
    # Ищем блок server
    if grep -q "server {" "$NGINX_CONFIG"; then
        # Создаем временный файл с добавленным location /api/
        TEMP_FILE=$(mktemp)
        
        # Копируем файл и добавляем location /api/ после listen
        awk '
        /listen 80;/ {
            print $0
            getline
            print $0
            print ""
            print "    # API запросы → бэкенд"
            print "    location /api/ {"
            print "        proxy_pass http://127.0.0.1:8000;"
            print "        proxy_set_header Host $host;"
            print "        proxy_set_header X-Real-IP $remote_addr;"
            print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "        proxy_set_header X-Forwarded-Proto $scheme;"
            print "    }"
            print ""
            print "    # Health check → бэкенд"
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
        
        # Заменяем оригинальный файл
        mv "$TEMP_FILE" "$NGINX_CONFIG"
        echo "✅ Добавлен location /api/ и /health"
    else
        echo "❌ Не найден блок server {, нужно добавить вручную"
        echo "Добавьте в конфигурацию:"
        echo ""
        echo "    location /api/ {"
        echo "        proxy_pass http://127.0.0.1:8000;"
        echo "        proxy_set_header Host \$host;"
        echo "        proxy_set_header X-Real-IP \$remote_addr;"
        echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
        echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
        echo "    }"
        exit 1
    fi
fi

# Проверяем синтаксис
echo ""
echo "=== ПРОВЕРКА СИНТАКСИСА ==="
if nginx -t 2>&1; then
    echo ""
    echo "✅ Синтаксис правильный"
    echo ""
    echo "=== ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ ==="
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
    echo ""
    echo "=== ПРОВЕРКА ==="
    echo "Health через Nginx:"
    curl -s http://localhost/health
    echo ""
    echo "API через Nginx:"
    curl -s -I http://localhost/api/profiles/ | head -5
else
    echo ""
    echo "❌ Ошибка синтаксиса! Восстанавливаем из резервной копии..."
    cp "$BACKUP" "$NGINX_CONFIG"
    echo "✅ Восстановлено из резервной копии"
    exit 1
fi

echo ""
echo "=== ГОТОВО ==="
echo "Конфигурация: $NGINX_CONFIG"
echo "Резервная копия: $BACKUP"


