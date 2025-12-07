# Запуск полной диагностики

## 🚀 Выполните на сервере:

```bash
# Загрузите скрипт диагностики
scp COMPLETE_DIAGNOSTIC.sh root@155.212.170.255:/root/

# На сервере
ssh root@155.212.170.255
chmod +x /root/COMPLETE_DIAGNOSTIC.sh
/root/COMPLETE_DIAGNOSTIC.sh
```

## 📋 Или выполните команды вручную:

```bash
ssh root@155.212.170.255 << 'EOF'
echo "=== 1. БЭКЕНД ==="
systemctl status studnet-backend.service --no-pager | head -5
curl -s http://127.0.0.1:8000/health
echo ""

echo "=== 2. CLOUDFLARE TUNNEL ==="
curl -s -m 5 https://rica-student-trusted-puzzle.trycloudflare.com/health
echo ""

echo "=== 3. CORS ==="
cat /var/www/studnet/backend_python/.env | grep CORS_ORIGINS
echo ""

echo "=== 4. ПРОВЕРКА CORS ЗАГОЛОВКОВ ==="
curl -v -H "Origin: https://web.telegram.org" -H "Access-Control-Request-Method: POST" -X OPTIONS https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/ 2>&1 | grep -i "access-control"
echo ""

echo "=== 5. ЛОГИ (последние запросы) ==="
tail -10 /var/log/studnet/backend_access.log 2>/dev/null
echo ""

echo "=== 6. ОШИБКИ ==="
tail -10 /var/log/studnet/backend_error.log 2>/dev/null
EOF
```

## 🔍 Проверка в браузере:

Откройте консоль (F12) и выполните:

```javascript
// Проверьте конфигурацию
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);

// Проверьте health
fetch('https://rica-student-trusted-puzzle.trycloudflare.com/health')
  .then(r => r.json())
  .then(d => console.log('✅ Health OK:', d))
  .catch(e => console.error('❌ Health ERROR:', e));

// Проверьте profiles endpoint
fetch('https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/', {method: 'OPTIONS'})
  .then(r => {
    console.log('CORS headers:', {
      'access-control-allow-origin': r.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': r.headers.get('access-control-allow-methods')
    });
  })
  .catch(e => console.error('CORS check error:', e));
```

## 📊 Что проверить:

1. ✅ Бэкенд доступен локально?
2. ✅ Бэкенд доступен через туннель?
3. ✅ CORS настроен правильно?
4. ✅ CORS заголовки возвращаются?
5. ✅ Что в логах при попытке запроса?

Выполните диагностику и пришлите результаты.

