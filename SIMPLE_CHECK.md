# Простые команды для проверки сервера

## ✅ Исправленная команда (без проблем с кавычками):

```bash
ssh root@155.212.170.255 'bash -s' < check_server_fixed.sh
```

Или выполните команды по отдельности:

## 1. Проверка бэкенда:

```bash
ssh root@155.212.170.255 "curl http://localhost:8080/health"
ssh root@155.212.170.255 "ps aux | grep uvicorn | grep -v grep"
ssh root@155.212.170.255 "netstat -tuln | grep 8080"
```

## 2. Проверка базы данных:

```bash
ssh root@155.212.170.255 "systemctl status postgresql"
ssh root@155.212.170.255 "ps aux | grep postgres | grep -v grep"
```

## 3. Проверка фронтенда:

```bash
ssh root@155.212.170.255 "ls -la /var/www/studnet/public/"
ssh root@155.212.170.255 "systemctl status nginx"
```

## 4. Проверка Cloudflare Tunnel:

```bash
ssh root@155.212.170.255 "ps aux | grep cloudflared | grep -v grep"
ssh root@155.212.170.255 "curl https://rica-student-trusted-puzzle.trycloudflare.com/health"
```

## 🔧 Что видно из вашего вывода:

1. ✅ **Бэкенд**: Процесс запущен (PID: 15750, 15759, и т.д.), но недоступен по localhost:8080
   - Возможно, слушает на другом порту или адресе
   
2. ❓ **База данных**: Нужно проверить статус

3. ✅ **Фронтенд**: Найден в `/var/www/studnet/public/index.html`

4. ✅ **Nginx**: Запущен

## 🔍 Детальная проверка бэкенда:

```bash
ssh root@155.212.170.255
```

Затем на сервере:

```bash
# Проверьте на каком порту/адресе слушает uvicorn
netstat -tulpn | grep uvicorn
# или
ss -tulpn | grep uvicorn

# Проверьте логи бэкенда
journalctl -u ваш-backend-service -n 50
# или если запущен вручную, найдите где
ps aux | grep uvicorn

# Проверьте конфигурацию
find /var/www -name "main.py" -o -name ".env" | head -5
```

## 🚀 Быстрая проверка всех компонентов:

```bash
ssh root@155.212.170.255 << 'ENDSSH'
echo "=== БЭКЕНД ==="
curl -s http://localhost:8080/health || echo "НЕДОСТУПЕН"
ps aux | grep uvicorn | grep -v grep | head -1
netstat -tuln | grep 8080
echo ""
echo "=== БАЗА ДАННЫХ ==="
systemctl is-active postgresql
ps aux | grep postgres | grep -v grep | head -1
echo ""
echo "=== ФРОНТЕНД ==="
ls -la /var/www/studnet/public/index.html
systemctl is-active nginx
echo ""
echo "=== CLOUDFLARE TUNNEL ==="
ps aux | grep cloudflared | grep -v grep | head -1
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health || echo "НЕДОСТУПЕН"
ENDSSH
```

