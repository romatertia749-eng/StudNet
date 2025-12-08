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
    # Если основная конфигурация, проверяем включает ли она другие файлы
    if grep -q "include.*conf.d" /etc/nginx/nginx.conf; then
        NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
        # Создаем файл если его нет
        if [ ! -f "$NGINX_CONFIG" ]; then
            mkdir -p /etc/nginx/conf.d
            touch "$NGINX_CONFIG"
        fi
    else
        NGINX_CONFIG="/etc/nginx/nginx.conf"
    fi
fi

# Если не нашли, ищем все .conf файлы
if [ -z "$NGINX_CONFIG" ] || [ ! -f "$NGINX_CONFIG" ]; then
    echo "Ищем все конфигурационные файлы..."
    CONFIG_FILES=$(find /etc/nginx -name "*.conf" -type f 2>/dev/null | head -1)
    if [ -n "$CONFIG_FILES" ]; then
        NGINX_CONFIG="$CONFIG_FILES"
        echo "Найден файл: $NGINX_CONFIG"
    fi
fi

if [ -z "$NGINX_CONFIG" ] || [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Конфигурация не найдена, создаем новую..."
    mkdir -p /etc/nginx/conf.d
    NGINX_CONFIG="/etc/nginx/conf.d/default.conf"
    
    # Создаем базовую конфигурацию
    cat > "$NGINX_CONFIG" << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # API запросы → бэкенд
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
NGINX_EOF
    echo "✅ Создана новая конфигурация: $NGINX_CONFIG"
else
    echo "✅ Найдена конфигурация: $NGINX_CONFIG"
    
    # Создаем резервную копию
    BACKUP="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP"
    echo "✅ Создана резервная копия: $BACKUP"
    
    # Проверяем, есть ли location /api/
    if grep -q "location /api/" "$NGINX_CONFIG"; then
        echo "⚠️  Location /api/ уже существует"
        if grep -A 5 "location /api/" "$NGINX_CONFIG" | grep -q "proxy_pass.*8000"; then
            echo "✅ Location /api/ правильно настроен"
        else
            echo "⚠️  Location /api/ не проксирует на порт 8000, исправляем..."
            # Исправляем proxy_pass
            sed -i 's|proxy_pass.*|proxy_pass http://127.0.0.1:8000;|g' "$NGINX_CONFIG"
        fi
    else
        echo "❌ Location /api/ не найден, добавляем..."
        
        # Создаем временный файл
        TEMP_FILE=$(mktemp)
        
        # Ищем где вставить (после listen или в начале server блока)
        if grep -q "listen 80" "$NGINX_CONFIG"; then
            # Вставляем после listen
            awk '
            /listen 80/ {
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
        else
            # Вставляем в начало server блока
            awk '
            /server \{/ {
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
        fi
        
        mv "$TEMP_FILE" "$NGINX_CONFIG"
        echo "✅ Добавлен location /api/ и /health"
    fi
    
    # Проверяем location /health
    if ! grep -q "location /health" "$NGINX_CONFIG"; then
        echo "Добавляем location /health..."
        # Добавляем после location /api/
        sed -i '/location \/api\/ {/a\
    # Health check → бэкенд\
    location /health {\
        proxy_pass http://127.0.0.1:8000;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }' "$NGINX_CONFIG"
    fi
fi

# Убеждаемся, что /etc/nginx/nginx.conf включает наш файл
if [ -f "/etc/nginx/nginx.conf" ] && [ "$NGINX_CONFIG" != "/etc/nginx/nginx.conf" ]; then
    if ! grep -q "include.*conf.d.*conf" /etc/nginx/nginx.conf; then
        echo "Добавляем include в nginx.conf..."
        # Добавляем include в http блок
        if grep -q "http {" /etc/nginx/nginx.conf; then
            sed -i '/http {/a\    include /etc/nginx/conf.d/*.conf;' /etc/nginx/nginx.conf
        fi
    fi
fi

echo ""
echo "=== ПРОВЕРКА СИНТАКСИСА ==="
if nginx -t 2>&1; then
    echo ""
    echo "✅ Синтаксис правильный"
    echo ""
    echo "=== ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ ==="
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx перезагружен"
    else
        echo "❌ Ошибка перезагрузки Nginx"
        exit 1
    fi
    echo ""
    echo "=== ПРОВЕРКА ==="
    echo "Health через Nginx:"
    curl -s http://localhost/health
    echo ""
    echo ""
    echo "API через Nginx (должен вернуть ошибку, но не HTML):"
    curl -s -I http://localhost/api/profiles/ 2>&1 | head -3
    echo ""
    echo "=== ГОТОВО ==="
    echo "Конфигурация: $NGINX_CONFIG"
    if [ -n "$BACKUP" ]; then
        echo "Резервная копия: $BACKUP"
    fi
else
    echo ""
    echo "❌ Ошибка синтаксиса!"
    if [ -n "$BACKUP" ]; then
        echo "Восстанавливаем из резервной копии..."
        cp "$BACKUP" "$NGINX_CONFIG"
        echo "✅ Восстановлено из резервной копии"
    fi
    exit 1
fi


