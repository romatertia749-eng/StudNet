#!/bin/bash

# Скрипт для деплоя на сервер
# Использование: ./deploy.sh [frontend|backend|all]

DEPLOY_TYPE=${1:-all}
SERVER="root@155.212.170.255"
FRONTEND_PATH="/var/www/studnet/public"
BACKEND_PATH="/var/www/studnet/backend_python"

echo "=== ДЕПЛОЙ НА СЕРВЕР ==="
echo "Тип: $DEPLOY_TYPE"
echo ""

if [ "$DEPLOY_TYPE" = "frontend" ] || [ "$DEPLOY_TYPE" = "all" ]; then
    echo "=== ДЕПЛОЙ ФРОНТЕНДА ==="
    echo "1. Сборка проекта..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка сборки"
        exit 1
    fi
    
    echo "2. Загрузка на сервер..."
    scp -r build/* $SERVER:$FRONTEND_PATH/
    
    if [ $? -eq 0 ]; then
        echo "✅ Фронтенд загружен"
    else
        echo "❌ Ошибка загрузки фронтенда"
        exit 1
    fi
fi

if [ "$DEPLOY_TYPE" = "backend" ] || [ "$DEPLOY_TYPE" = "all" ]; then
    echo ""
    echo "=== ДЕПЛОЙ БЭКЕНДА ==="
    echo "Обновление бэкенда на сервере..."
    
    ssh $SERVER << 'ENDSSH'
cd /var/www/studnet/backend_python
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Бэкенд обновлен"
    systemctl restart studnet-backend.service
    echo "✅ Бэкенд перезапущен"
else
    echo "❌ Ошибка обновления бэкенда"
    exit 1
fi
ENDSSH
fi

echo ""
echo "=== ДЕПЛОЙ ЗАВЕРШЕН ==="


