# MAX Networking App

React-приложение для интеграции с MAX Platform через MAX Bridge.

## Структура проекта

```
src/
├── contexts/
│   └── WebAppContext.js    # Контекст для работы с MAX WebApp API
├── App.js                   # Основной компонент приложения
├── App.css                  # Стили приложения (mobile-first)
└── index.js                 # Точка входа приложения
```

## Интеграция с MAX Platform

### MAX Bridge
Скрипт MAX Bridge подключен в `public/index.html`:
```html
<script src="https://st.max.ru/js/max-web-app.js"></script>
```

### WebApp API
Приложение использует глобальный объект `window.WebApp` для:
- Получения данных пользователя (`initDataUnsafe.user`)
- Вызова Bridge функций (`requestContact()`, `close()`)
- Инициализации приложения (`ready()`)

## Разработка

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm start
```
Приложение откроется на [http://localhost:3000](http://localhost:3000)

### Сборка для production
```bash
npm run build
```
Собранные файлы будут в папке `build/`

## Развертывание

1. Соберите проект:
   ```bash
   npm run build
   ```

2. Загрузите содержимое папки `build/` на хостинг с поддержкой HTTPS:
   - Vercel
   - Netlify
   - GitHub Pages
   - Любой другой хостинг с HTTPS

3. Получите HTTPS-ссылку на приложение (например: `https://your-app.vercel.app`)

4. Зарегистрируйтесь на бизнес-платформе MAX: [business.max.ru/self](https://business.max.ru/self)

5. Создайте чат-бота и пройдите модерацию

6. В настройках чат-бота укажите URL вашего мини-приложения

7. Сохраните настройки и протестируйте приложение в MAX на мобильном устройстве

## Backend API

Приложение отправляет запросы на ваш backend API. Укажите правильный URL в `src/App.js`:

```javascript
fetch('https://your-backend/api/new-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    userId: userInfo.id,
    // ...
  }),
});
```

## Использование WebApp API

### В компонентах
```javascript
import { useWebApp } from './contexts/WebAppContext';

function MyComponent() {
  const { webApp, userInfo, requestContact, closeApp } = useWebApp();
  
  // userInfo содержит данные пользователя из MAX
  // webApp - прямой доступ к window.WebApp
}
```

### Доступные функции
- `requestContact()` - запрос контакта пользователя
- `closeApp()` - закрытие мини-приложения
- `userInfo` - информация о пользователе (id, username, first_name, last_name)
- `webApp` - прямой доступ к объекту WebApp для расширенных функций

## Mobile-first дизайн

Приложение оптимизировано для мобильных устройств:
- Адаптивная верстка
- Touch-friendly кнопки
- Простой интерфейс без сложных многоуровневых меню

## Тестирование

После развертывания проверьте:
1. Запуск приложения в MAX
2. Получение данных пользователя
3. Работу Bridge функций (requestContact, closeApp)
4. Отправку данных на backend API
