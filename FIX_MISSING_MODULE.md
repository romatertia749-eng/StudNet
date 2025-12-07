# Исправление: ModuleNotFoundError: No module named 'imagekitio'

## 🔍 Проблема:

Бэкенд падает из-за отсутствующего модуля `imagekitio`.

## ✅ Решение:

### 1. Установите недостающие зависимости:

```bash
cd /var/www/studnet/backend_python
source venv/bin/activate
pip install imagekitio
```

### 2. Или установите все зависимости из requirements.txt:

```bash
cd /var/www/studnet/backend_python
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Проверьте requirements.txt:

```bash
cat /var/www/studnet/backend_python/requirements.txt | grep -i imagekit
```

Если нет - добавьте:
```bash
echo "imagekitio" >> /var/www/studnet/backend_python/requirements.txt
```

### 4. Перезапустите бэкенд:

```bash
systemctl restart studnet-backend.service
systemctl status studnet-backend.service
```

### 5. Проверьте:

```bash
curl http://127.0.0.1:8000/health
```

## 🚀 Быстрое исправление (одной командой):

```bash
cd /var/www/studnet/backend_python && source venv/bin/activate && pip install imagekitio && systemctl restart studnet-backend.service && sleep 3 && curl http://127.0.0.1:8000/health
```

