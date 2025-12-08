#!/bin/bash

echo "=== ИСПРАВЛЕНИЕ КОНФЛИКТУЮЩИХ SERVER БЛОКОВ ==="
echo ""

# Находим все конфигурационные файлы
CONFIG_FILES=$(find /etc/nginx -name "*.conf" -type f 2>/dev/null | grep -E "(conf.d|sites-enabled)")

echo "Найденные конфигурационные файлы:"
echo "$CONFIG_FILES"
echo ""

# Проверяем, сколько server блоков с server_name "_"
CONFLICTS=$(grep -r "server_name _" /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ 2>/dev/null | wc -l)

if [ "$CONFLICTS" -gt 1 ]; then
    echo "⚠️  Найдено $CONFLICTS server блоков с server_name \"_\""
    echo ""
    echo "Список файлов с конфликтами:"
    grep -r "server_name _" /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ 2>/dev/null | cut -d: -f1 | sort -u
    echo ""
    
    # Предлагаем оставить только один активный файл
    MAIN_CONFIG="/etc/nginx/conf.d/default.conf"
    
    if [ -f "$MAIN_CONFIG" ]; then
        echo "Основной файл: $MAIN_CONFIG"
        echo ""
        echo "Варианты решения:"
        echo "1. Оставить только $MAIN_CONFIG активным"
        echo "2. Переименовать другие файлы в .disabled"
        echo ""
        read -p "Переименовать конфликтующие файлы? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for file in $(grep -r "server_name _" /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ 2>/dev/null | cut -d: -f1 | sort -u); do
                if [ "$file" != "$MAIN_CONFIG" ]; then
                    mv "$file" "${file}.disabled"
                    echo "✅ Переименован: $file → ${file}.disabled"
                fi
            done
            
            echo ""
            echo "=== ПРОВЕРКА СИНТАКСИСА ==="
            if nginx -t; then
                echo "✅ Синтаксис правильный"
                systemctl reload nginx
                echo "✅ Nginx перезагружен"
            else
                echo "❌ Ошибка синтаксиса!"
                exit 1
            fi
        fi
    fi
else
    echo "✅ Конфликтов не найдено или только один server блок"
fi

echo ""
echo "=== ПРОВЕРКА РАБОТЫ ==="
echo "Health endpoint:"
curl -s http://localhost/health
echo ""
echo ""
echo "API endpoint (должен вернуть ошибку, но не HTML):"
curl -s -I http://localhost/api/profiles/ 2>&1 | head -3


