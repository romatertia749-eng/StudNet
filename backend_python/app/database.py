from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
import logging
from dotenv import load_dotenv

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Загружаем переменные из .env файла
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# КРИТИЧЕСКИ ВАЖНО: Настройки для работы на Koyeb и других облачных платформах
# Исправляем формат DATABASE_URL если нужно (для некоторых провайдеров)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    logger.info("Fixed DATABASE_URL format (postgres:// -> postgresql://)")

# Определяем, используется ли Neon (scale to zero)
is_neon = "neon.tech" in DATABASE_URL or "neon" in DATABASE_URL.lower()
if is_neon:
    logger.info("Neon database detected - using scale-to-zero optimizations")

# Определяем, используется ли Vercel (может влиять на cold start)
is_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
if is_vercel:
    logger.info("Vercel environment detected - using Vercel optimizations")

# Настройки пула соединений для облачных платформ
# ВАЖНО: Для Neon с "scale to zero" и Vercel нужны увеличенные таймауты
# Для Vercel также важно учитывать cold start serverless функций
pool_size = 2 if (is_neon or is_vercel) else 3
max_overflow = 3 if (is_neon or is_vercel) else 5
pool_recycle = 900 if is_neon else (1200 if is_vercel else 1800)  # 15 мин для Neon, 20 мин для Vercel, 30 для других
connect_timeout = 30 if (is_neon or is_vercel) else 10  # 30 секунд для Neon/Vercel (cold start), 10 для других

logger.info(f"Database pool config: pool_size={pool_size}, max_overflow={max_overflow}, pool_recycle={pool_recycle}s, connect_timeout={connect_timeout}s")

engine = create_engine(
    DATABASE_URL,
    # Пул соединений - критически важно для стабильности
    poolclass=QueuePool,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_pre_ping=True,  # Проверка соединений перед использованием (важно для всех платформ!)
    pool_recycle=pool_recycle,
    
    # Таймауты для подключения
    # ВАЖНО: Для Neon и Vercel с cold start первый запрос может занимать 10-30 секунд
    connect_args={
        "connect_timeout": connect_timeout,
    },
    
    # Дополнительные настройки
    echo=False,  # Логирование SQL запросов (отключено для production)
)

# pool_pre_ping автоматически проверяет соединения перед использованием
# Это быстрее и надежнее, чем ручная проверка

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Получение сессии БД с обработкой ошибок и retry для Neon scale-to-zero"""
    import time
    
    # Проверяем, используется ли Neon или Vercel
    db_url = os.getenv("DATABASE_URL", "")
    is_neon_db = "neon.tech" in db_url or "neon" in db_url.lower()
    is_vercel_db = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
    
    # Для Neon и Vercel с cold start первый запрос может занять время
    # Добавляем retry логику для холодного старта
    max_retries = 2 if (is_neon_db or is_vercel_db) else 1
    retry_delay = 2 if is_neon_db else 3 if is_vercel_db else 1  # Больше задержка для Vercel
    
    for attempt in range(max_retries + 1):
        try:
            db = SessionLocal()
            # pool_pre_ping автоматически проверяет соединение
            # Для Neon это может занять время при холодном старте
            yield db
            return  # Успешно - выходим
        except Exception as e:
            error_str = str(e).lower()
            # Проверяем, это ошибка подключения (cold start) или другая
            is_connection_error = any(keyword in error_str for keyword in [
                'connection', 'timeout', 'refused', 'closed', 'network',
                'could not connect', 'server closed', 'connection reset'
            ])
            
            if db:
                try:
                    db.close()
                except:
                    pass
            
            # Если это ошибка подключения и есть еще попытки - retry
            if is_connection_error and attempt < max_retries:
                logger.warning(f"Database connection error (attempt {attempt + 1}/{max_retries + 1}), retrying in {retry_delay}s: {e}")
                time.sleep(retry_delay)
                retry_delay *= 2  # Экспоненциальная задержка
                continue
            else:
                # Другие ошибки или закончились попытки
                logger.error(f"Database error in request: {e}")
                raise

def check_db_connection():
    """Проверка подключения к БД с retry для Neon scale-to-zero"""
    import time
    
    # Проверяем, используется ли Neon или Vercel
    db_url = os.getenv("DATABASE_URL", "")
    is_neon_db = "neon.tech" in db_url or "neon" in db_url.lower()
    is_vercel_db = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
    
    max_retries = 2 if (is_neon_db or is_vercel_db) else 1
    retry_delay = 2 if is_neon_db else 3 if is_vercel_db else 1  # Больше задержка для Vercel
    
    for attempt in range(max_retries + 1):
        try:
            from sqlalchemy import text
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()
            return True
        except Exception as e:
            if attempt < max_retries:
                logger.warning(f"Database connection check failed (attempt {attempt + 1}), retrying: {e}")
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            else:
                logger.error(f"Database connection check failed after all retries: {e}")
                return False

