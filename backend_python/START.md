# Быстрый старт FastAPI бэкенда

## 1. Установка зависимостей

```bash
cd backend_python
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## 2. Настройка базы данных

База данных уже должна быть создана (используется та же, что и для Spring Boot).

Проверь, что PostgreSQL запущен и база `networking_app` существует.

## 3. Запуск

```bash
uvicorn app.main:app --reload --port 8080
```

## 4. Проверка

- API: http://localhost:8080
- Документация: http://localhost:8080/docs
- Health check: http://localhost:8080/health

## 5. Остановка Spring Boot

Перед запуском FastAPI останови Spring Boot бэкенд (Ctrl+C в терминале, где он запущен).

## 6. Тестирование

```bash
# Проверка health
curl http://localhost:8080/health

# Получение профилей
curl "http://localhost:8080/api/profiles?userId=123456789"

# Получение мэтчей
curl "http://localhost:8080/api/matches?userId=123456789"
```

## Отличия от Spring Boot

- Тот же порт: 8080
- Те же endpoints
- Та же база данных
- Автоматическая документация API (Swagger UI)

