# Полная проверка сервера (исправленная)

## ✅ Выполните эти команды на сервере:

```bash
echo "=== БЭКЕНД (порт 8000) ==="
curl -s http://localhost:8000/health || echo "НЕДОСТУПЕН"
curl -s http://127.0.0.1:8000/health || echo "НЕДОСТУПЕН"
systemctl status studnet-backend.service --no-pager | head -5
echo ""

echo "=== БАЗА ДАННЫХ ==="
systemctl status postgresql --no-pager | head -5
ps aux | grep postgres | grep -v grep | head -1
echo ""

echo "=== ФРОНТЕНД ==="
ls -la /var/www/studnet/public/index.html
systemctl status nginx --no-pager | head -5
echo ""

echo "=== CLOUDFLARE TUNNEL ==="
ps aux | grep cloudflared | grep -v grep | head -1
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health || echo "НЕДОСТУПЕН"
echo ""

echo "=== ЛОГИ БЭКЕНДА (последние ошибки) ==="
tail -10 /var/log/studnet/backend_error.log 2>/dev/null || echo "Лог не найден"
```

## 🔍 Проверка конфигурации:

```bash
# Конфигурация systemd service
systemctl cat studnet-backend.service

# Конфигурация Cloudflare Tunnel
ps aux | grep cloudflared

# Конфигурация nginx
nginx -t
cat /etc/nginx/sites-enabled/* | grep -A 10 "studnet\|backend\|8000\|8080"
```

## 🎯 Главная проблема:

Бэкенд на **порту 8000**, а фронтенд/туннель могут ожидать **8080**. Нужно синхронизировать.

