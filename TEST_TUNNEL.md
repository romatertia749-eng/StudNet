# Тест туннеля и запросов

## 1. Проверка туннеля (на сервере):

```bash
ssh root@155.212.170.255

# Полная проверка health через туннель
curl -v -m 15 https://rica-student-trusted-puzzle.trycloudflare.com/health 2>&1

# Проверка POST запроса (симуляция создания профиля)
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://web.telegram.org" \
  -d '{"test":"data"}' \
  https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/ 2>&1 | head -30
```

## 2. Проверка в браузере (консоль F12):

```javascript
// Тест 1: Health check
fetch('https://rica-student-trusted-puzzle.trycloudflare.com/health')
  .then(r => {
    console.log('✅ Health Status:', r.status);
    return r.json();
  })
  .then(d => console.log('✅ Health Data:', d))
  .catch(e => {
    console.error('❌ Health Error:', e);
    console.error('Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
  });

// Тест 2: CORS preflight
fetch('https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://web.telegram.org',
    'Access-Control-Request-Method': 'POST'
  }
})
  .then(r => {
    console.log('✅ CORS Preflight Status:', r.status);
    console.log('CORS Headers:', {
      'allow-origin': r.headers.get('access-control-allow-origin'),
      'allow-methods': r.headers.get('access-control-allow-methods'),
      'allow-credentials': r.headers.get('access-control-allow-credentials')
    });
  })
  .catch(e => {
    console.error('❌ CORS Preflight Error:', e);
  });

// Тест 3: POST запрос (симуляция)
const formData = new FormData();
formData.append('name', 'Test');
formData.append('age', '20');

fetch('https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/', {
  method: 'POST',
  body: formData,
  mode: 'cors'
})
  .then(r => {
    console.log('✅ POST Status:', r.status);
    return r.text();
  })
  .then(t => console.log('✅ POST Response:', t.substring(0, 200)))
  .catch(e => {
    console.error('❌ POST Error:', e);
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
  });
```

## 3. Проверка логов на сервере (после теста):

```bash
# Смотрите логи в реальном времени
tail -f /var/log/studnet/backend_access.log

# Или последние запросы
tail -20 /var/log/studnet/backend_access.log
```

## 4. Что проверить:

1. ✅ Туннель отвечает на health?
2. ✅ CORS preflight проходит?
3. ✅ POST запрос доходит до сервера?
4. ✅ Что в логах бэкенда?

Выполните тесты и пришлите результаты.

