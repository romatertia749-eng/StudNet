#!/bin/bash

echo "=========================================="
echo "ПРОВЕРКА СЕРВЕРА"
echo "=========================================="
echo ""

echo "=== БЭКЕНД ==="
curl -s http://localhost:8080/health || echo "НЕДОСТУПЕН"
pgrep -f uvicorn && echo "Процесс запущен" || echo "Процесс не найден"
netstat -tuln | grep 8080 && echo "Порт 8080 открыт" || echo "Порт 8080 закрыт"
echo ""

echo "=== БАЗА ДАННЫХ ==="
systemctl is-active postgresql && echo "PostgreSQL запущен" || echo "PostgreSQL остановлен"
pgrep -f postgres && echo "Процесс найден" || echo "Процесс не найден"
netstat -tuln | grep 5432 && echo "Порт 5432 открыт" || echo "Порт 5432 закрыт"
echo ""

echo "=== ФРОНТЕНД ==="
find /var/www -name index.html 2>/dev/null | head -1 && echo "Найден" || echo "Не найден"
systemctl is-active nginx && echo "Nginx запущен" || echo "Nginx остановлен"
curl -I http://localhost 2>/dev/null | head -1
echo ""

echo "=== CLOUDFLARE TUNNEL ==="
pgrep -f cloudflared && echo "Запущен" || echo "Остановлен"
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health && echo "Доступен" || echo "Недоступен"
echo ""

echo "=== РЕСУРСЫ ==="
free -h | grep Mem
df -h / | tail -1

