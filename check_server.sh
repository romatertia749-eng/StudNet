#!/bin/bash

# Скрипт для проверки всех компонентов сервера
# Использование: bash check_server.sh

echo "=========================================="
echo "🔍 ПРОВЕРКА КОМПОНЕНТОВ СЕРВЕРА"
echo "=========================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка бэкенда
echo "1️⃣  ПРОВЕРКА БЭКЕНДА"
echo "-------------------"

# Проверка health endpoint
echo -n "Health endpoint: "
if curl -s -f -m 5 http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Работает${NC}"
    curl -s http://localhost:8080/health | jq . 2>/dev/null || curl -s http://localhost:8080/health
else
    echo -e "${RED}✗ Недоступен${NC}"
fi

# Проверка процесса uvicorn
echo -n "Процесс uvicorn: "
if pgrep -f "uvicorn" > /dev/null; then
    echo -e "${GREEN}✓ Запущен${NC}"
    echo "   PID: $(pgrep -f 'uvicorn' | head -1)"
else
    echo -e "${RED}✗ Не запущен${NC}"
fi

# Проверка порта 8080
echo -n "Порт 8080: "
if netstat -tuln 2>/dev/null | grep -q ":8080" || ss -tuln 2>/dev/null | grep -q ":8080"; then
    echo -e "${GREEN}✓ Открыт${NC}"
else
    echo -e "${RED}✗ Закрыт${NC}"
fi

echo ""

# 2. Проверка базы данных
echo "2️⃣  ПРОВЕРКА БАЗЫ ДАННЫХ"
echo "-------------------"

# Проверка PostgreSQL
echo -n "PostgreSQL процесс: "
if pgrep -f "postgres" > /dev/null; then
    echo -e "${GREEN}✓ Запущен${NC}"
else
    echo -e "${RED}✗ Не запущен${NC}"
fi

# Проверка подключения к БД
echo -n "Подключение к БД: "
if command -v psql > /dev/null 2>&1; then
    if [ -f "/root/.env" ] || [ -f "/var/www/backend_python/.env" ]; then
        # Попытка найти DATABASE_URL
        DB_URL=$(grep DATABASE_URL /root/.env /var/www/backend_python/.env 2>/dev/null | head -1 | cut -d'=' -f2-)
        if [ -n "$DB_URL" ]; then
            if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Подключение успешно${NC}"
            else
                echo -e "${RED}✗ Ошибка подключения${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ DATABASE_URL не найден${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ .env файл не найден${NC}"
    fi
else
    echo -e "${YELLOW}⚠ psql не установлен${NC}"
fi

# Проверка порта PostgreSQL
echo -n "Порт PostgreSQL (5432): "
if netstat -tuln 2>/dev/null | grep -q ":5432" || ss -tuln 2>/dev/null | grep -q ":5432"; then
    echo -e "${GREEN}✓ Открыт${NC}"
else
    echo -e "${RED}✗ Закрыт${NC}"
fi

echo ""

# 3. Проверка фронтенда
echo "3️⃣  ПРОВЕРКА ФРОНТЕНДА"
echo "-------------------"

# Проверка директории фронтенда
FRONTEND_DIRS=("/var/www/frontend" "/var/www/html" "/var/www/studnet/build" "/root/build")
FOUND=0

for dir in "${FRONTEND_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -f "$dir/index.html" ]; then
        echo -e "${GREEN}✓ Найден в: $dir${NC}"
        echo "   Файлов: $(find $dir -type f | wc -l)"
        FOUND=1
        break
    fi
done

if [ $FOUND -eq 0 ]; then
    echo -e "${RED}✗ Не найден${NC}"
    echo "   Проверенные директории: ${FRONTEND_DIRS[*]}"
fi

# Проверка nginx
echo -n "Nginx процесс: "
if pgrep -f "nginx" > /dev/null; then
    echo -e "${GREEN}✓ Запущен${NC}"
else
    echo -e "${RED}✗ Не запущен${NC}"
fi

# Проверка порта 80
echo -n "Порт 80 (HTTP): "
if netstat -tuln 2>/dev/null | grep -q ":80" || ss -tuln 2>/dev/null | grep -q ":80"; then
    echo -e "${GREEN}✓ Открыт${NC}"
else
    echo -e "${RED}✗ Закрыт${NC}"
fi

echo ""

# 4. Проверка Cloudflare Tunnel
echo "4️⃣  ПРОВЕРКА CLOUDFLARE TUNNEL"
echo "-------------------"

echo -n "Процесс cloudflared: "
if pgrep -f "cloudflared" > /dev/null; then
    echo -e "${GREEN}✓ Запущен${NC}"
    echo "   PID: $(pgrep -f 'cloudflared' | head -1)"
else
    echo -e "${RED}✗ Не запущен${NC}"
fi

# Проверка доступности через туннель
echo -n "Доступность через туннель: "
if curl -s -f -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Доступен${NC}"
else
    echo -e "${RED}✗ Недоступен${NC}"
fi

echo ""

# 5. Проверка системных ресурсов
echo "5️⃣  СИСТЕМНЫЕ РЕСУРСЫ"
echo "-------------------"

echo "Память:"
free -h | grep Mem | awk '{print "   Использовано: " $3 " / " $2 " (" int($3/$2*100) "%)"}'

echo "Диск:"
df -h / | tail -1 | awk '{print "   Использовано: " $3 " / " $2 " (" $5 ")"}'

echo "Загрузка CPU:"
uptime | awk -F'load average:' '{print "   " $2}'

echo ""

# 6. Проверка логов (последние ошибки)
echo "6️⃣  ПОСЛЕДНИЕ ОШИБКИ В ЛОГАХ"
echo "-------------------"

if [ -f "/var/log/nginx/error.log" ]; then
    echo "Nginx ошибки (последние 3):"
    tail -3 /var/log/nginx/error.log 2>/dev/null | sed 's/^/   /' || echo "   Нет ошибок"
fi

echo ""

# Итоговая сводка
echo "=========================================="
echo "📊 ИТОГОВАЯ СВОДКА"
echo "=========================================="

ALL_OK=1

if ! pgrep -f "uvicorn" > /dev/null; then
    echo -e "${RED}⚠ Бэкенд не запущен${NC}"
    ALL_OK=0
fi

if ! pgrep -f "postgres" > /dev/null; then
    echo -e "${RED}⚠ PostgreSQL не запущен${NC}"
    ALL_OK=0
fi

if ! pgrep -f "nginx" > /dev/null; then
    echo -e "${RED}⚠ Nginx не запущен${NC}"
    ALL_OK=0
fi

if [ $ALL_OK -eq 1 ]; then
    echo -e "${GREEN}✓ Все основные компоненты работают${NC}"
else
    echo -e "${YELLOW}⚠ Некоторые компоненты требуют внимания${NC}"
fi

echo ""

