# Финальная проверка всех компонентов сервера

## ✅ Полная проверка (выполните на сервере):

```bash
echo "=========================================="
echo "🔍 ФИНАЛЬНАЯ ПРОВЕРКА СЕРВЕРА"
echo "=========================================="
echo ""

echo "1️⃣ БЭКЕНД (порт 8000)"
echo "-------------------"
curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health
echo ""
systemctl is-active studnet-backend.service && echo "✓ Service активен" || echo "✗ Service неактивен"
ps aux | grep gunicorn | grep -v grep | wc -l | xargs -I {} echo "Процессов: {}"
echo ""

echo "2️⃣ БАЗА ДАННЫХ"
echo "-------------------"
systemctl is-active postgresql && echo "✓ PostgreSQL запущен" || echo "✗ PostgreSQL остановлен"
sudo -u postgres psql -d studnet_production -c "SELECT count(*) as connections FROM pg_stat_activity WHERE datname = 'studnet_production';" 2>/dev/null | tail -3
echo ""

echo "3️⃣ ФРОНТЕНД"
echo "-------------------"
ls -la /var/www/studnet/public/index.html 2>/dev/null && echo "✓ Фронтенд найден" || echo "✗ Фронтенд не найден"
systemctl is-active nginx && echo "✓ Nginx запущен" || echo "✗ Nginx остановлен"
curl -I http://localhost 2>/dev/null | head -1
echo ""

echo "4️⃣ CLOUDFLARE TUNNEL"
echo "-------------------"
ps aux | grep cloudflared | grep -v grep | head -1 && echo "✓ Туннель запущен" || echo "✗ Туннель не запущен"
echo -n "Доступность через туннель: "
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health | jq . 2>/dev/null || curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health || echo "НЕДОСТУПЕН"
echo ""

echo "5️⃣ РЕСУРСЫ СИСТЕМЫ"
echo "-------------------"
free -h | grep Mem | awk '{print "Память: " $3 " / " $2 " (" int($3/$2*100) "%)"}'
df -h / | tail -1 | awk '{print "Диск: " $3 " / " $2 " (" $5 ")"}'
echo ""

echo "=========================================="
echo "📊 ИТОГ"
echo "=========================================="
```

## 🎯 Быстрая проверка (минимум):

```bash
echo "=== БЫСТРАЯ ПРОВЕРКА ==="
echo ""
echo -n "Бэкенд: "
curl -s http://localhost:8000/health | grep -q "ok\|status" && echo "✓ OK" || echo "✗ ERROR"
echo -n "База данных: "
sudo -u postgres psql -d studnet_production -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ OK" || echo "✗ ERROR"
echo -n "Фронтенд: "
ls /var/www/studnet/public/index.html > /dev/null 2>&1 && echo "✓ OK" || echo "✗ ERROR"
echo -n "Nginx: "
systemctl is-active nginx > /dev/null 2>&1 && echo "✓ OK" || echo "✗ ERROR"
echo -n "Cloudflare Tunnel: "
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health > /dev/null 2>&1 && echo "✓ OK" || echo "✗ ERROR"
```

