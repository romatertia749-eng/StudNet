#!/usr/bin/env node

/**
 * Скрипт для проверки доступности бэкенда
 * Использование: node check_backend.js [URL]
 */

const https = require('https');
const http = require('http');

const url = process.argv[2] || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
const healthUrl = `${url}/health`;

console.log('🔍 Проверка доступности бэкенда...\n');
console.log(`URL: ${url}`);
console.log(`Health endpoint: ${healthUrl}\n`);

const client = url.startsWith('https') ? https : http;

const startTime = Date.now();

const req = client.get(healthUrl, (res) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Бэкенд доступен!');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response time: ${duration}ms`);
      try {
        const json = JSON.parse(data);
        console.log(`   Response:`, json);
      } catch (e) {
        console.log(`   Response: ${data}`);
      }
      process.exit(0);
    } else {
      console.log('⚠️  Бэкенд отвечает, но с ошибкой');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response: ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('❌ Бэкенд недоступен!');
  console.log(`   Error: ${error.message}`);
  console.log(`   Time: ${duration}ms`);
  console.log('\n💡 Возможные причины:');
  console.log('   1. Бэкенд не запущен');
  console.log('   2. Неправильный URL');
  console.log('   3. Проблемы с сетью/файрволом');
  console.log('   4. CORS блокирует запрос');
  console.log('\n📝 Проверьте:');
  console.log(`   - Запущен ли бэкенд на ${url}`);
  console.log(`   - Доступен ли эндпоинт ${healthUrl}`);
  console.log('   - Правильно ли настроен REACT_APP_API_BASE_URL');
  process.exit(1);
});

req.setTimeout(5000, () => {
  req.destroy();
  console.log('❌ Таймаут запроса (5 секунд)');
  console.log('   Сервер не отвечает в течение 5 секунд');
  process.exit(1);
});

