from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import profiles, matches, auth
import os

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

# Статические файлы больше не нужны, используем Cloudinary
# Но оставляем для обратной совместимости, если кто-то использует локальное хранилище

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

