# Исправление проблемы с переполнением пула соединений

## 🔍 Проблема:

`QueuePool limit of size 3 overflow 5 reached, connection timed out`

Все соединения к БД заняты, новые не могут быть созданы.

## ✅ Решения:

### 1. Проверить активные соединения к БД:

```bash
# Подключиться к PostgreSQL
sudo -u postgres psql -d studnet_production

# В psql выполните:
SELECT count(*) FROM pg_stat_activity;
SELECT pid, usename, application_name, state, query FROM pg_stat_activity WHERE datname = 'studnet_production';
\q
```

### 2. Убить зависшие соединения:

```bash
# Найти и убить зависшие соединения
sudo -u postgres psql -d studnet_production -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'studnet_production' AND state = 'idle' AND state_change < now() - interval '5 minutes';"
```

### 3. Перезапустить бэкенд (освободит соединения):

```bash
systemctl restart studnet-backend.service
systemctl status studnet-backend.service
```

### 4. Проверить настройки PostgreSQL:

```bash
# Проверить max_connections
sudo -u postgres psql -c "SHOW max_connections;"

# Проверить текущие соединения
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### 5. Увеличить размер пула в бэкенде (если нужно):

```bash
# Проверьте настройки пула в коде бэкенда
grep -r "pool_size\|poolclass" /var/www/studnet/backend_python/app/
```

## 🚀 Быстрое исправление (выполните по порядку):

```bash
# 1. Убить зависшие соединения
sudo -u postgres psql -d studnet_production -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'studnet_production' AND state = 'idle' AND state_change < now() - interval '1 minute';"

# 2. Перезапустить бэкенд
systemctl restart studnet-backend.service

# 3. Подождать 5 секунд
sleep 5

# 4. Проверить health
curl http://localhost:8000/health
```

## 📋 Полная диагностика:

```bash
echo "=== АКТИВНЫЕ СОЕДИНЕНИЯ ==="
sudo -u postgres psql -d studnet_production -c "SELECT count(*) as total_connections, state, count(*) FROM pg_stat_activity WHERE datname = 'studnet_production' GROUP BY state;"
echo ""

echo "=== ЗАВИСШИЕ СОЕДИНЕНИЯ ==="
sudo -u postgres psql -d studnet_production -c "SELECT pid, usename, state, state_change, now() - state_change as idle_time FROM pg_stat_activity WHERE datname = 'studnet_production' AND state = 'idle' ORDER BY state_change;"
echo ""

echo "=== НАСТРОЙКИ POSTGRESQL ==="
sudo -u postgres psql -c "SHOW max_connections;"
sudo -u postgres psql -c "SHOW shared_buffers;"
```

