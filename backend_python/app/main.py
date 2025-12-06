from fastapi import FastAPI, Request, status, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, Response
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
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Networking App API", version="1.0.0", redirect_slashes=False)
logger.info("FastAPI application initialized")

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
        "https://telegram.me",  # Для мобильных приложений
        "https://t.me",  # Для мобильных приложений
    ]
    for domain in telegram_domains:
        if domain not in allowed_origins:
            allowed_origins.append(domain)
    
    # ВАЖНО: Для мобильных Telegram Web Apps может использоваться null origin или разные поддомены
    # Добавляем все возможные варианты
    logger.info(f"Production mode: Allowed origins: {allowed_origins}")

# Middleware для логирования и обработки trailing slash
class TrailingSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import time
        import logging
        logger = logging.getLogger(__name__)
        
        path = request.url.path
        method = request.method
        origin = request.headers.get("origin", "no-origin")
        user_agent = request.headers.get("user-agent", "unknown")
        start_time = time.time()
        
        # Логируем только важные запросы (не все, чтобы не замедлять)
        if path.startswith("/api/profiles") or path.startswith("/api/connection-feedback"):
            logger.info(f"[TrailingSlashMiddleware] {method} {path} from origin={origin}, UA={user_agent[:50]}")
        
        try:
            response = await call_next(request)
            elapsed_time = time.time() - start_time
            
            # Логируем медленные запросы (> 5 секунд)
            if elapsed_time > 5:
                logger.warning(f"[TrailingSlashMiddleware] Slow request: {method} {path} took {elapsed_time:.2f}s (origin={origin})")
            
            # Логируем CORS ошибки
            if response.status_code == 403 or (response.status_code == 400 and "CORS" in str(response.headers.get("access-control-allow-origin", ""))):
                logger.error(f"[TrailingSlashMiddleware] Possible CORS issue: {method} {path} from origin={origin}, status={response.status_code}")
            
            # Если получили 405 для POST /api/profiles/, логируем
            if path == "/api/profiles/" and method == "POST" and response.status_code == 405:
                logger.warning(f"[TrailingSlashMiddleware] Got 405 for POST /api/profiles/ from origin={origin}")
            
            # Если получили 405 для POST /api/connection-feedback, логируем
            if path.startswith("/api/connection-feedback") and method == "POST" and response.status_code == 405:
                logger.error(f"[TrailingSlashMiddleware] Got 405 for POST {path} from origin={origin}, status={response.status_code}")
                try:
                    routes_info = []
                    for r in app.routes:
                        if hasattr(r, 'path'):
                            routes_info.append(f"{r.methods if hasattr(r, 'methods') else 'N/A'}: {r.path}")
                    logger.error(f"[TrailingSlashMiddleware] Available routes: {routes_info}")
                except Exception as e:
                    logger.error(f"[TrailingSlashMiddleware] Error getting routes: {e}")
            
            return response
        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error(f"[TrailingSlashMiddleware] Error in {method} {path} from origin={origin} after {elapsed_time:.2f}s: {str(e)}", exc_info=True)
            raise

app.add_middleware(TrailingSlashMiddleware)

# CORS Middleware - ВАЖНО: для мобильных Telegram Web Apps
# Используем специальный middleware для обработки всех origins в production
class FlexibleCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # В production разрешаем все origins для Telegram Web Apps
        if is_production and origin:
            response = await call_next(request)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Expose-Headers"] = "*"
            return response
        
        # Для OPTIONS запросов в production
        if is_production and request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin or "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                }
            )
        
        return await call_next(request)

if is_production:
    # В production используем гибкий CORS для мобильных устройств
    app.add_middleware(FlexibleCORSMiddleware)
    logger.info("CORS configured: flexible mode for production (allows all origins for Telegram Web Apps)")
else:
    # В development используем стандартный CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    logger.info(f"CORS configured: allowed origins: {allowed_origins}")

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

# Регистрируем остальные роутеры ПОСЛЕ connection-feedback POST роутера
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(matches.router)

# Регистрируем GET роуты для connection-feedback через роутер
# Это лучше, чем дублировать роуты в main.py
app.include_router(connection_feedback.router)

@app.get("/health")
def health():
    """Health check endpoint с проверкой БД"""
    import time
    from app.database import check_db_connection
    
    start_time = time.time()
    db_status = check_db_connection()
    elapsed = time.time() - start_time
    
    if db_status:
        return {
            "status": "ok", 
            "database": "connected",
            "db_check_time": f"{elapsed:.2f}s"
        }
    else:
        return {
            "status": "degraded", 
            "database": "disconnected",
            "db_check_time": f"{elapsed:.2f}s"
        }

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

