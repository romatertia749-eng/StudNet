from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import profiles, matches, auth
import os
from pathlib import Path

app = FastAPI(title="Networking App API", version="1.0.0")

# CORS
allowed_origins = [
    "http://localhost:3000",
    "https://web.telegram.org",
]

# Добавляем домен из переменной окружения, если указан
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

# Для production можно разрешить все origins (небезопасно, но для Telegram Web Apps нужно)
# Или добавить конкретные домены через переменную окружения
cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
if cors_origins and cors_origins[0]:
    allowed_origins.extend([origin.strip() for origin in cors_origins if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы (фотографии)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads/photos")
upload_path = Path(UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)

# Монтируем статические файлы только если директория существует
if upload_path.exists():
    app.mount("/uploads", StaticFiles(directory=str(upload_path.parent)), name="uploads")

# Роутеры
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(matches.router)

@app.get("/")
def root():
    return {"message": "Networking App API"}

@app.get("/health")
def health():
    return {"status": "ok"}

