# Полная проверка запроса

## 1. Проверка POST запроса БЕЗ обрезки (на сервере):

```bash
ssh root@155.212.170.255

# Полный ответ (без head)
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://web.telegram.org" \
  -d '{"name":"test","age":20,"gender":"male"}' \
  https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/ 2>&1

# Или только тело ответа
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://web.telegram.org" \
  -d '{"name":"test","age":20,"gender":"male"}' \
  https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/
```

## 2. Проверка логов бэкенда:

```bash
# Последние запросы
tail -30 /var/log/studnet/backend_access.log

# Или в реальном времени (выполните запрос, потом Ctrl+C)
tail -f /var/log/studnet/backend_access.log
```

## 3. Проверка с FormData (как в реальном приложении):

```bash
# Симуляция FormData запроса
curl -v -X POST \
  -H "Origin: https://web.telegram.org" \
  -F "name=TestUser" \
  -F "age=20" \
  -F "gender=male" \
  -F "city=Moscow" \
  https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/ 2>&1
```

## 4. Проверка в браузере (консоль F12):

```javascript
// Реальный тест с FormData
const formData = new FormData();
formData.append('name', 'TestUser');
formData.append('age', '20');
formData.append('gender', 'male');
formData.append('city', 'Moscow');

console.log('Отправка запроса...');
fetch('https://rica-student-trusted-puzzle.trycloudflare.com/api/profiles/', {
  method: 'POST',
  body: formData,
  mode: 'cors'
})
  .then(async r => {
    console.log('✅ Status:', r.status);
    console.log('✅ Headers:', Object.fromEntries(r.headers.entries()));
    const text = await r.text();
    console.log('✅ Response:', text.substring(0, 500));
    if (!r.ok) {
      console.error('❌ Error response:', text);
    }
    return r;
  })
  .catch(e => {
    console.error('❌ Fetch Error:', e);
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);
  });
```

Выполните все проверки и пришлите результаты.

