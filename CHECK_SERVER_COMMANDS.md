# Команды для проверки сервера

## 🔍 Быстрая проверка всех компонентов

### Вариант 1: Использовать скрипт (рекомендуется)

```bash
# Загрузите скрипт на сервер
scp check_server.sh root@155.212.170.255:/root/

# На сервере
ssh root@155.212.170.255
chmod +x /root/check_server.sh
/root/check_server.sh
```

### Вариант 2: Команды вручную

## 1️⃣ Проверка бэкенда

```bash
ssh root@155.212.170.255

# Проверка health endpoint
curl http://localhost:8080/health

# Проверка процесса
ps aux | grep uvicorn

# Проверка порта
netstat -tuln | grep 8080
# или
ss -tuln | grep 8080

# Проверка логов бэкенда (если есть systemd service)
journalctl -u ваш-backend-service -n 50 --no-pager
```

## 2️⃣ Проверка базы данных

```bash
# Проверка процесса PostgreSQL
ps aux | grep postgres

# Проверка порта
netstat -tuln | grep 5432

# Проверка подключения (если знаете DATABASE_URL)
psql "postgresql://user:password@localhost:5432/dbname" -c "SELECT version();"

# Или если PostgreSQL запущен локально
sudo -u postgres psql -c "SELECT version();"

# Проверка статуса PostgreSQL
systemctl status postgresql
# или
systemctl status postgresql@*-main
```

## 3️⃣ Проверка фронтенда

```bash
# Поиск директории фронтенда
find /var/www -name "index.html" -type f 2>/dev/null
find /root -name "index.html" -type f 2>/dev/null

# Проверка nginx
systemctl status nginx
ps aux | grep nginx

# Проверка конфигурации nginx
nginx -t

# Проверка порта 80
netstat -tuln | grep :80

# Проверка доступности через HTTP
curl -I http://localhost
curl -I http://155.212.170.255
```

## 4️⃣ Проверка Cloudflare Tunnel

```bash
# Проверка процесса
ps aux | grep cloudflared

# Проверка доступности через туннель
curl https://rica-student-trusted-puzzle.trycloudflare.com/health

# Проверка логов туннеля (если запущен как service)
journalctl -u cloudflared -n 50 --no-pager
```

## 5️⃣ Проверка системных ресурсов

```bash
# Память
free -h

# Диск
df -h

# CPU и загрузка
top -bn1 | head -5
# или
htop

# Сетевые подключения
netstat -tuln
# или
ss -tuln
```

## 6️⃣ Проверка логов

```bash
# Логи nginx
tail -50 /var/log/nginx/error.log
tail -50 /var/log/nginx/access.log

# Логи системы
journalctl -n 50 --no-pager

# Логи бэкенда (если есть)
journalctl -u ваш-backend-service -n 50 --no-pager

# Поиск ошибок в логах
grep -i error /var/log/nginx/error.log | tail -20
```

## 📋 Полная диагностика (одной командой)

```bash
ssh root@155.212.170.255 << 'EOF'
echo "=== БЭКЕНД ==="
curl -s http://localhost:8080/health || echo "Бэкенд недоступен"
ps aux | grep uvicorn | grep -v grep || echo "Процесс не найден"
echo ""
echo "=== БАЗА ДАННЫХ ==="
systemctl status postgresql --no-pager -l | head -5
ps aux | grep postgres | grep -v grep | head -1 || echo "Процесс не найден"
echo ""
echo "=== ФРОНТЕНД ==="
find /var/www -name "index.html" 2>/dev/null | head -1
systemctl status nginx --no-pager -l | head -5
echo ""
echo "=== CLOUDFLARE TUNNEL ==="
ps aux | grep cloudflared | grep -v grep || echo "Процесс не найден"
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health || echo "Туннель недоступен"
echo ""
echo "=== РЕСУРСЫ ==="
free -h | grep Mem
df -h / | tail -1
EOF
```

## 🔧 Команды для исправления проблем

### Если бэкенд не запущен:

```bash
# Найдите директорию бэкенда
find /var/www -name "main.py" -type f 2>/dev/null
find /root -name "main.py" -type f 2>/dev/null

# Запустите бэкенд
cd /путь/к/бэкенду
source venv/bin/activate  # если есть venv
uvicorn app.main:app --host 0.0.0.0 --port 8080

# Или если есть systemd service
systemctl start ваш-backend-service
systemctl enable ваш-backend-service
```

### Если PostgreSQL не запущен:

```bash
systemctl start postgresql
systemctl enable postgresql
systemctl status postgresql
```

### Если nginx не запущен:

```bash
systemctl start nginx
systemctl enable nginx
nginx -t  # проверка конфигурации
systemctl reload nginx
```

### Если Cloudflare Tunnel не запущен:

```bash
# Найдите конфигурацию
find /root -name "*.yaml" -o -name "config.json" 2>/dev/null | grep -i cloudflare

# Запустите туннель
cloudflared tunnel --url http://localhost:8080

# Или если настроен как service
systemctl start cloudflared
systemctl enable cloudflared
```

## ✅ Быстрая проверка (минимум)

```bash
# Все одной командой
ssh root@155.212.170.255 "curl -s http://localhost:8080/health && echo ' - Бэкенд OK' || echo ' - Бэкенд ERROR'; systemctl is-active postgresql && echo 'PostgreSQL OK' || echo 'PostgreSQL ERROR'; systemctl is-active nginx && echo 'Nginx OK' || echo 'Nginx ERROR'"
```

