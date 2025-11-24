# Настройка базы данных для Koyeb

## Проблема
Локальная база (`localhost:5432`) не работает на Koyeb — нужна внешняя база.

## Решение: Neon (бесплатно, без карты)

### Шаг 1: Создать базу на Neon
1. Зайдите на [neon.tech](https://neon.tech)
2. Sign up (через GitHub)
3. **Create project**:
   - Name: `networking-app`
   - Region: ближайший
   - PostgreSQL: 15 или 16
4. После создания скопируйте **Connection string** (это ваш `DATABASE_URL`)

### Шаг 2: Обновить DATABASE_URL в Koyeb
1. Koyeb → ваш сервис → **Settings** → **Environment Variables**
2. Найдите `DATABASE_URL`
3. Замените на Connection string из Neon
4. Сохраните

### Шаг 3: Создать таблицы
1. Neon → ваш проект → **SQL Editor**
2. Откройте файл `database/schema.sql` в вашем проекте
3. Скопируйте весь SQL код
4. Вставьте в SQL Editor
5. Нажмите **Run**

### Шаг 4: Перезапустить Koyeb
1. Koyeb → **Deployments** → **Restart**

### Шаг 5: Проверить
- Koyeb → **Logs** — не должно быть ошибок подключения
- Откройте Telegram Web App и попробуйте создать профиль

## Альтернатива: Railway
Если у вас уже есть база на Railway:
1. Railway → ваш проект → PostgreSQL сервис
2. **Settings** → **Variables**
3. Скопируйте `DATABASE_URL`
4. Вставьте в Koyeb вместо `localhost`

