from fastapi import FastAPI, Request, status, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from app.routers import profiles, matches, auth, connection_feedback
from app.routers.connection_feedback_post import router as connection_feedback_post_router
from app.routers.profiles import _create_profile_impl
from app.database import get_db
from app.schemas import ProfileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
from pathlib import Path

app = FastAPI(title="Networking App API", version="1.0.0", redirect_slashes=False)

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

# Middleware для логирования и обработки trailing slash
class TrailingSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        
        # Логируем все POST запросы к /api/profiles
        if path.startswith("/api/profiles") and method == "POST":
            print(f"[TrailingSlashMiddleware] POST request to: {path}")
        
        # Логируем все запросы к /api/connection-feedback
        if path.startswith("/api/connection-feedback"):
            print(f"[TrailingSlashMiddleware] {method} request to: {path}")
        
        response = await call_next(request)
        
        # Если получили 405 для POST /api/profiles/, логируем
        if path == "/api/profiles/" and method == "POST" and response.status_code == 405:
            print(f"[TrailingSlashMiddleware] Got 405 for POST /api/profiles/, trying to handle...")
        
        # Если получили 405 для POST /api/connection-feedback, логируем
        if path.startswith("/api/connection-feedback") and method == "POST" and response.status_code == 405:
            print(f"[TrailingSlashMiddleware] Got 405 for POST {path}, status={response.status_code}")
            try:
                routes_info = []
                for r in app.routes:
                    if hasattr(r, 'path'):
                        routes_info.append(f"{r.methods if hasattr(r, 'methods') else 'N/A'}: {r.path}")
                print(f"[TrailingSlashMiddleware] Available routes: {routes_info}")
            except Exception as e:
                print(f"[TrailingSlashMiddleware] Error getting routes: {e}")
        
        return response

app.add_middleware(TrailingSlashMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Явно указываем все методы
    allow_headers=["*"],
    expose_headers=["*"],
)

# Роутеры - ВАЖНО: регистрируем в правильном порядке
# Сначала более специфичные, потом общие
# API роуты должны быть зарегистрированы ДО catch-all роута

# Импортируем все необходимое для connection-feedback
from app.schemas import ConnectionFeedbackCreate, ConnectionFeedbackResponse, ConnectionFeedbackType
from app.services import connection_feedback_service
from typing import List

# КРИТИЧЕСКИ ВАЖНО: Регистрируем POST роутер ПЕРВЫМ
# до всех остальных роутеров, чтобы он имел максимальный приоритет
app.include_router(connection_feedback_post_router)

# POST роуты теперь в отдельном роутере connection_feedback_post_router
# который зарегистрирован выше ПЕРВЫМ

# Дополнительный роут для POST /api/profiles/ (со слэшем) - регистрируем ПЕРЕД роутером
# чтобы он обрабатывался первым
@app.post("/api/profiles/", response_model=ProfileResponse, include_in_schema=True, tags=["profiles"])
async def create_profile_slash_fallback(
    user_id: int = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    age: int = Form(...),
    city: str = Form(...),
    university: str = Form(...),
    interests: str = Form(...),
    goals: str = Form(...),
    bio: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Fallback роут для POST /api/profiles/ со слэшем - обрабатывается первым"""
    return _create_profile_impl(
        user_id, name, gender, age, city, university, interests, goals,
        bio, username, first_name, last_name, photo, db
    )

# Регистрируем остальные роутеры ПОСЛЕ connection-feedback роутов
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(matches.router)
# Роутер connection_feedback отключен, все роуты в main.py
# app.include_router(connection_feedback.router)

# GET роуты для connection-feedback
@app.get("/api/connection-feedback/match/{match_id}", response_model=List[ConnectionFeedbackResponse], tags=["connection-feedback"])
def get_feedbacks_for_match(
    match_id: int,
    user_id: Optional[int] = Query(None, description="ID пользователя для фильтрации"),
    db: Session = Depends(get_db)
):
    """Получает все отметки для мэтча"""
    try:
        feedbacks = connection_feedback_service.get_feedbacks_for_match(
            db=db,
            match_id=match_id,
            user_id=user_id
        )
        return feedbacks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении отметок: {str(e)}")

@app.get("/api/connection-feedback/types", response_model=List[str], tags=["connection-feedback"])
def get_feedback_types():
    """Получает список доступных типов отметок"""
    return ConnectionFeedbackType.all_types()

@app.get("/api/connection-feedback/match-id", tags=["connection-feedback"])
def get_match_id(
    user1_id: int = Query(..., description="ID первого пользователя"),
    user2_id: int = Query(..., description="ID второго пользователя"),
    db: Session = Depends(get_db)
):
    """Получает ID мэтча между двумя пользователями"""
    try:
        match_id = connection_feedback_service.get_match_id_for_users(
            db=db,
            user1_id=user1_id,
            user2_id=user2_id
        )
        if match_id is None:
            raise HTTPException(status_code=404, detail="Мэтч не найден")
        return {"match_id": match_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении мэтча: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok"}

# Раздача загруженных фотографий
uploads_path = Path(__file__).parent.parent / "uploads" / "photos"
if uploads_path.exists():
    app.mount("/uploads/photos", StaticFiles(directory=str(uploads_path)), name="uploads")
    print(f"[main.py] Mounted /uploads/photos from {uploads_path}")
else:
    print(f"[main.py] Warning: uploads/photos directory does not exist at {uploads_path}")

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

