# Исправление падения бэкенда

## 🔍 Проблема:

Бэкенд падает при запуске. Service пытается перезапуститься, но не может запуститься.

## ✅ Диагностика:

### 1. Проверьте логи бэкенда:

```bash
# Логи systemd
journalctl -u studnet-backend.service -n 50 --no-pager

# Логи ошибок
tail -50 /var/log/studnet/backend_error.log
```

### 2. Проверьте конфигурацию service:

```bash
systemctl cat studnet-backend.service
```

### 3. Попробуйте запустить вручную:

```bash
cd /var/www/studnet/backend_python
source venv/bin/activate
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
```

Посмотрите, какая ошибка выводится.

## 🔧 Возможные проблемы:

### Проблема 1: База данных недоступна

```bash
# Проверьте DATABASE_URL
cat /var/www/studnet/backend_python/.env | grep DATABASE_URL

# Проверьте подключение
sudo -u postgres psql -d studnet_production -c "SELECT 1;"
```

### Проблема 2: Зависимости не установлены

```bash
cd /var/www/studnet/backend_python
source venv/bin/activate
pip install -r requirements.txt
```

### Проблема 3: Проблемы с правами

```bash
# Проверьте права на файлы
ls -la /var/www/studnet/backend_python/
chown -R www-data:www-data /var/www/studnet/backend_python/
```

### Проблема 4: Порт занят

```bash
# Проверьте, не занят ли порт 8000
ss -tuln | grep 8000
lsof -i :8000
```

## 🚀 Быстрое исправление:

```bash
# 1. Остановите service
systemctl stop studnet-backend.service

# 2. Проверьте логи
journalctl -u studnet-backend.service -n 50 --no-pager

# 3. Попробуйте запустить вручную и посмотрите ошибку
cd /var/www/studnet/backend_python
source venv/bin/activate
python -c "from app.main import app; print('OK')"
```

