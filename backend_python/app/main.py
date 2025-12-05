from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import profiles, matches, auth
import os
from pathlib import Path

app = FastAPI(title="Networking App API", version="1.0.0")

# CORS
allowed_origins = [
    "http://localhost:3000",
    "https://web.telegram.org",
    "https://telegram.org",
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

# Убираем дубликаты
allowed_origins = list(dict.fromkeys(allowed_origins))

# Для Render, Koyeb и других платформ добавляем поддержку Telegram доменов
# Это необходимо для работы Telegram Mini Apps
# Примечание: FastAPI не поддерживает wildcard в CORS, поэтому добавляем конкретные домены
is_production = (
    os.getenv("RENDER") or 
    os.getenv("RENDER_EXTERNAL_URL") or 
    os.getenv("KOYEB") or 
    os.getenv("KOYEB_SERVICE_NAME") or
    os.getenv("RAILWAY_ENVIRONMENT") or
    os.getenv("VERCEL") or
    os.getenv("PRODUCTION", "").lower() == "true"
)

if is_production:
    # Telegram использует несколько доменов, добавляем основные
    telegram_domains = [
        "https://web.telegram.org",
        "https://telegram.org",
        "https://desktop.telegram.org",
    ]
    for domain in telegram_domains:
        if domain not in allowed_origins:
            allowed_origins.append(domain)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Явно указываем все методы
    allow_headers=["*"],
    expose_headers=["*"],
)

# Статические файлы больше не нужны, используем Cloudinary
# Но оставляем для обратной совместимости, если кто-то использует локальное хранилище

# Роутеры - ВАЖНО: регистрируем в правильном порядке
# Сначала более специфичные, потом общие
# API роуты должны быть зарегистрированы ДО catch-all роута

# Регистрируем роутеры
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(matches.router)

@app.get("/health")
def health():
    return {"status": "ok"}

# Обслуживание статических файлов фронтенда
# Включается только если фронт и бэкенд на одном сервере (монолитный деплой)
# Если фронт на отдельном домене (Vercel/Netlify), установи FRONTEND_ON_SAME_DOMAIN=false
serve_frontend = os.getenv("FRONTEND_ON_SAME_DOMAIN", "false").lower() == "true"

if serve_frontend:
    build_path = Path(__file__).parent.parent.parent / "build"
    
    if build_path.exists():
        static_path = build_path / "static"
        assets_path = build_path / "assets"
        
        if static_path.exists():
            app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
        
        if assets_path.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")
        
        @app.get("/manifest.json")
        async def serve_manifest():
            file_path = build_path / "manifest.json"
            if file_path.exists():
                return FileResponse(str(file_path))
            return {"error": "Not found"}
        
        @app.get("/robots.txt")
        async def serve_robots():
            file_path = build_path / "robots.txt"
            if file_path.exists():
                return FileResponse(str(file_path))
            return {"error": "Not found"}
        
        @app.get("/favicon.ico")
        async def serve_favicon():
            file_path = build_path / "favicon.ico"
            if file_path.exists():
                return FileResponse(str(file_path))
            return {"error": "Not found"}
        
        # Catch-all для SPA routing (только если фронт на том же домене)
        @app.get("/{path:path}")
        async def serve_spa(path: str):
            if path.startswith("api/"):
                from fastapi import HTTPException
                raise HTTPException(status_code=404, detail="API endpoint not found")
            
            if build_path.exists():
                file_path = build_path / path
                if file_path.exists() and file_path.is_file() and file_path.suffix in [".json", ".txt", ".ico", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"]:
                    return FileResponse(str(file_path))
                
                index_path = build_path / "index.html"
                if index_path.exists():
                    return FileResponse(str(index_path))
            
            return {"message": "Networking App API - Frontend not built. Run 'npm run build' first."}
else:
    # Если фронт на отдельном домене, отдаем 404 для всех не-API путей
    @app.get("/{path:path}")
    async def catch_all(path: str):
        if path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Frontend is served separately. This is API only.")

