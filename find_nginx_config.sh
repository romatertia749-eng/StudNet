#!/bin/bash

echo "=== ПОИСК КОНФИГУРАЦИИ NGINX ==="
echo ""

# Проверяем стандартные места
echo "1. Проверка /etc/nginx/sites-enabled/default:"
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "   ✅ Найден: /etc/nginx/sites-enabled/default"
    ls -lh /etc/nginx/sites-enabled/default
else
    echo "   ❌ Не найден"
fi

echo ""
echo "2. Проверка /etc/nginx/conf.d/:"
if [ -d "/etc/nginx/conf.d" ]; then
    echo "   ✅ Директория существует"
    ls -lh /etc/nginx/conf.d/
else
    echo "   ❌ Директория не существует"
fi

echo ""
echo "3. Проверка /etc/nginx/nginx.conf:"
if [ -f "/etc/nginx/nginx.conf" ]; then
    echo "   ✅ Найден: /etc/nginx/nginx.conf"
    echo "   Проверяем, включает ли он другие файлы:"
    grep -E "include|conf.d|sites-enabled" /etc/nginx/nginx.conf | head -5
else
    echo "   ❌ Не найден"
fi

echo ""
echo "4. Поиск всех .conf файлов в /etc/nginx:"
find /etc/nginx -name "*.conf" -type f 2>/dev/null | while read file; do
    echo "   📄 $file"
    echo "      Размер: $(stat -c%s "$file" 2>/dev/null || echo "unknown") байт"
    echo "      Содержит 'server': $(grep -c "server {" "$file" 2>/dev/null || echo "0")"
done

echo ""
echo "5. Проверка активных конфигураций:"
nginx -T 2>/dev/null | grep -E "configuration file|# configuration file" | head -3

echo ""
echo "=== ТЕКУЩАЯ КОНФИГУРАЦИЯ NGINX ==="
echo "Показываем основную конфигурацию:"
if [ -f "/etc/nginx/nginx.conf" ]; then
    cat /etc/nginx/nginx.conf | head -30
fi


