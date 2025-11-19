# Как выполнить schema.sql вручную

## Способ 1: Через командную строку (psql)

### Windows:

1. Откройте **Командную строку** (cmd) или **PowerShell**

2. Перейдите в папку с проектом:
```bash
cd C:\Users\Lenovo\max-networking-app
```

3. Выполните команду:
```bash
psql -U postgres -d networking_app -f database/schema.sql
```

4. Введите пароль от пользователя `postgres` когда попросит

**Если psql не найден:**
- Добавьте PostgreSQL в PATH:
  - Путь обычно: `C:\Program Files\PostgreSQL\15\bin`
  - Или используйте полный путь:
```bash
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d networking_app -f database/schema.sql
```

### macOS/Linux:

```bash
# Перейдите в папку проекта
cd ~/max-networking-app

# Выполните скрипт
psql -U postgres -d networking_app -f database/schema.sql
```

---

## Способ 2: Через psql интерактивно

1. Откройте терминал и подключитесь к PostgreSQL:
```bash
psql -U postgres
```

2. Создайте базу данных (если еще не создана):
```sql
CREATE DATABASE networking_app;
```

3. Подключитесь к базе данных:
```sql
\c networking_app
```

4. Выполните скрипт:
```sql
\i database/schema.sql
```

Или скопируйте содержимое `schema.sql` и вставьте в консоль psql.

---

## Способ 3: Через pgAdmin (GUI)

1. Откройте **pgAdmin 4**

2. Подключитесь к серверу PostgreSQL

3. Правой кнопкой на **Databases** → **Create** → **Database**
   - Name: `networking_app`
   - Owner: `postgres`
   - Нажмите **Save**

4. Раскройте `networking_app` → правой кнопкой на **Schemas** → **public** → **Query Tool**

5. Откройте файл `database/schema.sql` в текстовом редакторе, скопируйте весь код

6. Вставьте код в Query Tool и нажмите **Execute** (F5)

---

## Способ 4: Через DBeaver / DataGrip / другие IDE

1. Откройте вашу IDE для работы с БД

2. Подключитесь к PostgreSQL:
   - Host: `localhost`
   - Port: `5432`
   - Database: `networking_app` (или `postgres` для создания)
   - User: `postgres`
   - Password: ваш пароль

3. Если базы нет - создайте:
```sql
CREATE DATABASE networking_app;
```

4. Откройте файл `database/schema.sql`

5. Выполните скрипт (обычно F5 или кнопка "Execute")

---

## Проверка результата

После выполнения скрипта проверьте, что таблицы созданы:

```sql
-- Подключитесь к базе
\c networking_app

-- Посмотрите список таблиц
\dt

-- Должны быть таблицы:
-- - profiles
-- - swipes  
-- - matches
```

Или через SQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## Если возникают ошибки

### Ошибка: "database does not exist"
**Решение:** Сначала создайте базу данных:
```sql
CREATE DATABASE networking_app;
```

### Ошибка: "permission denied"
**Решение:** Убедитесь, что используете пользователя с правами (обычно `postgres`)

### Ошибка: "relation already exists"
**Решение:** Таблицы уже существуют. Можно:
- Удалить и пересоздать: `DROP TABLE IF EXISTS matches, swipes, profiles CASCADE;`
- Или использовать `CREATE TABLE IF NOT EXISTS` (уже есть в скрипте)

### Ошибка: "psql: command not found"
**Решение:** 
- Установите PostgreSQL
- Или используйте полный путь к psql
- Или используйте pgAdmin

---

## Пошаговая инструкция для новичков

### Шаг 1: Установите PostgreSQL
Скачайте с https://www.postgresql.org/download/

### Шаг 2: Запомните пароль
При установке вам зададут пароль для пользователя `postgres` - запомните его!

### Шаг 3: Откройте psql
- **Windows:** Пуск → PostgreSQL → SQL Shell (psql)
- **macOS/Linux:** Откройте терминал и введите `psql -U postgres`

### Шаг 4: Создайте базу данных
```sql
CREATE DATABASE networking_app;
```

### Шаг 5: Выйдите из psql
```sql
\q
```

### Шаг 6: Выполните скрипт
```bash
psql -U postgres -d networking_app -f database/schema.sql
```

### Шаг 7: Проверьте
```bash
psql -U postgres -d networking_app
```
```sql
\dt
```

---

## Альтернатива: Выполнить команды по одной

Если скрипт не работает, можно выполнить команды вручную:

1. Откройте `database/schema.sql` в текстовом редакторе

2. Подключитесь к базе:
```bash
psql -U postgres -d networking_app
```

3. Копируйте и выполняйте команды по очереди из файла

---

## Готово!

После выполнения скрипта ваша база данных готова к работе с бэкендом.

