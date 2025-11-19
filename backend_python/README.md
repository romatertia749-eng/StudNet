# Networking App Backend (FastAPI)

## Установка

1. Создай виртуальное окружение:
```bash
python -m venv venv
```

2. Активируй виртуальное окружение:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Установи зависимости:
```bash
pip install -r requirements.txt
```

## Настройка

Создай файл `.env` (опционально) или используй переменные окружения:

```env
DATABASE_URL=postgresql://postgres:!Miha596169@localhost:5432/networking_app
UPLOAD_DIR=./uploads/photos
MAX_FILE_SIZE=5242880
```

## Запуск

```bash
uvicorn app.main:app --reload --port 8080
```

API будет доступен на `http://localhost:8080`

## Endpoints

- `GET /api/profiles?userId=...` - получить список профилей
- `POST /api/profiles` - создать/обновить профиль
- `GET /api/profiles/{id}` - получить профиль по ID
- `POST /api/profiles/{id}/like` - лайкнуть профиль
- `POST /api/profiles/{id}/pass` - пропустить профиль
- `GET /api/matches?userId=...` - получить список мэтчей

## Документация API

После запуска доступна автоматическая документация:
- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

