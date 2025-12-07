# Исправление nginx без nano

## 🔍 Сначала посмотрите конфигурацию:

```bash
# Посмотрите какие файлы есть
ls -la /etc/nginx/sites-enabled/

# Посмотрите содержимое
cat /etc/nginx/sites-enabled/studnet
# или
cat /etc/nginx/sites-enabled/default
```

## ✅ Вариант 1: Автоматическое исправление (самый простой)

Если нужно изменить порт с 8080 на 8000:

```bash
# Создайте backup
cp /etc/nginx/sites-enabled/studnet /etc/nginx/sites-enabled/studnet.backup

# Замените порт автоматически
sed -i 's/127.0.0.1:8080/127.0.0.1:8000/g' /etc/nginx/sites-enabled/studnet
sed -i 's/localhost:8080/localhost:8000/g' /etc/nginx/sites-enabled/studnet

# Проверьте что изменилось
cat /etc/nginx/sites-enabled/studnet | grep proxy_pass
```

## ✅ Вариант 2: Через cat с перенаправлением

```bash
# Посмотрите текущую конфигурацию
cat /etc/nginx/sites-enabled/studnet

# Создайте новую конфигурацию через cat
cat > /etc/nginx/sites-enabled/studnet << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/studnet/public;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

## ✅ Вариант 3: Через vi/vim (если установлен)

```bash
vi /etc/nginx/sites-enabled/studnet
```

В vi:
- Нажмите `i` для входа в режим редактирования
- Найдите строку с `proxy_pass` (нажмите `/` и введите `proxy_pass`)
- Измените порт на 8000
- Нажмите `Esc`, затем `:wq` и Enter для сохранения

## ✅ Вариант 4: Показать мне конфигурацию

Просто выполните:

```bash
cat /etc/nginx/sites-enabled/studnet
```

И пришлите мне вывод - я скажу точную команду для исправления.

## 🔧 После исправления:

```bash
# Проверьте конфигурацию
nginx -t

# Если OK, перезагрузите
systemctl reload nginx

# Проверьте
curl http://localhost/api/health
```

