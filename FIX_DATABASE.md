# Исправление проблемы с базой данных

## 🔍 Проблема обнаружена:

Health endpoint показывает: `{"status":"degraded","database":"disconnected"}`

База данных не подключена к бэкенду.

## ✅ Команды для проверки и исправления:

### 1. Проверка PostgreSQL:

```bash
# Статус PostgreSQL
systemctl status postgresql

# Проверка процесса
ps aux | grep postgres | grep -v grep

# Проверка порта
ss -tuln | grep 5432
```

### 2. Проверка конфигурации бэкенда:

```bash
# Найдите .env файл бэкенда
cat /var/www/studnet/backend_python/.env | grep DATABASE_URL

# Или
find /var/www/studnet -name ".env" -exec grep DATABASE_URL {} \;
```

### 3. Проверка подключения к БД:

```bash
# Если знаете DATABASE_URL, проверьте подключение
# (замените на ваш реальный DATABASE_URL)
psql "postgresql://user:password@localhost:5432/dbname" -c "SELECT version();"

# Или если PostgreSQL запущен локально
sudo -u postgres psql -c "SELECT version();"
```

### 4. Проверка логов бэкенда:

```bash
# Ошибки подключения к БД
tail -50 /var/log/studnet/backend_error.log | grep -i database
tail -50 /var/log/studnet/backend_error.log | grep -i postgres
tail -50 /var/log/studnet/backend_error.log | grep -i connection
```

## 🔧 Возможные решения:

### Решение 1: Запустить PostgreSQL

```bash
# Запустить PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Проверить статус
systemctl status postgresql
```

### Решение 2: Проверить DATABASE_URL

```bash
# Проверьте .env файл
cat /var/www/studnet/backend_python/.env

# Убедитесь, что DATABASE_URL правильный
# Формат: postgresql://user:password@host:port/database
```

### Решение 3: Проверить доступность БД

```bash
# Если PostgreSQL на другом сервере, проверьте доступность
ping ваш-хост-бд
telnet ваш-хост-бд 5432
```

### Решение 4: Перезапустить бэкенд после исправления

```bash
systemctl restart studnet-backend.service
systemctl status studnet-backend.service
```

## 📋 Полная диагностика (выполните все):

```bash
echo "=== POSTGRESQL ==="
systemctl status postgresql --no-pager | head -5
ps aux | grep postgres | grep -v grep | head -1
echo ""

echo "=== DATABASE_URL ==="
cat /var/www/studnet/backend_python/.env | grep DATABASE_URL || echo "Не найден"
echo ""

echo "=== ЛОГИ БЭКЕНДА (ошибки БД) ==="
tail -20 /var/log/studnet/backend_error.log | grep -i -E "database|postgres|connection|error"
echo ""

echo "=== ПРОВЕРКА ПОДКЛЮЧЕНИЯ ==="
curl http://localhost:8000/health
```

