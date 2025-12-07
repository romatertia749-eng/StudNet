# Проверка бэкенда на сервере

## Правильные команды (без кавычек):

### 1. Проверка процессов uvicorn:

```bash
ps aux | grep uvicorn
```

### 2. Проверка портов (если netstat/ss не работают):

```bash
# Проверка через lsof (если установлен)
lsof -i :8080

# Или через /proc
cat /proc/net/tcp | grep :1F90
# (1F90 в hex = 8080 в decimal)
```

### 3. Проверка через curl:

```bash
# Проверка localhost
curl http://localhost:8080/health

# Проверка через IP
curl http://127.0.0.1:8080/health

# Проверка через внешний IP
curl http://155.212.170.255:8080/health
```

### 4. Где запущен бэкенд:

```bash
# Найти процесс
ps aux | grep uvicorn

# Найти директорию бэкенда
find /var/www -name "main.py" 2>/dev/null
find /root -name "main.py" 2>/dev/null

# Проверка через systemd (если есть service)
systemctl list-units | grep -i backend
systemctl list-units | grep -i studnet
systemctl list-units | grep -i python
```

### 5. Проверка логов:

```bash
# Если есть systemd service
journalctl -u studnet-backend -n 50
journalctl -u backend -n 50

# Или найти где запущен и посмотреть логи
ps aux | grep uvicorn
# Затем перейдите в директорию и проверьте логи
```

## Полная проверка (выполняйте команды по отдельности):

```bash
# 1. Процессы
ps aux | grep uvicorn

# 2. Проверка доступности
curl http://localhost:8080/health

# 3. Поиск конфигурации
find /var/www -name ".env" 2>/dev/null
find /root -name ".env" 2>/dev/null

# 4. Проверка systemd services
systemctl list-units --type=service | grep -E "backend|studnet|python"
```

