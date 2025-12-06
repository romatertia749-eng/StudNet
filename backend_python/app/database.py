from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import DisconnectionError
import os
import time
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

# Настройки пула соединений для облачных платформ
engine = create_engine(
    DATABASE_URL,
    # Пул соединений - критически важно для стабильности
    poolclass=QueuePool,
    pool_size=5,  # Количество постоянных соединений
    max_overflow=10,  # Дополнительные соединения при нагрузке
    pool_pre_ping=True,  # Проверка соединений перед использованием (важно для Koyeb!)
    pool_recycle=3600,  # Переподключение каждые 60 минут (важно для долгих соединений)
    
    # Таймауты для подключения
    connect_args={
        "connect_timeout": 10,  # 10 секунд на подключение
        "options": "-c statement_timeout=30000"  # 30 секунд на выполнение запроса
    },
    
    # Дополнительные настройки
    echo=False,  # Логирование SQL запросов (отключено для production)
    future=True,  # Использовать новый API SQLAlchemy 2.0
)

# Обработчик для переподключения при разрыве соединения
@event.listens_for(engine, "engine_connect")
def receive_connect(dbapi_conn, connection_record):
    """Обработчик подключения - проверяет соединение"""
    logger.info("Database connection established")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Обработчик получения соединения из пула"""
    try:
        # Проверяем соединение перед использованием (для psycopg2)
        cursor = dbapi_conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
    except Exception as e:
        logger.warning(f"Connection check failed, reconnecting: {e}")
        raise DisconnectionError("Connection lost, reconnecting...")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Получение сессии БД с обработкой ошибок"""
    db = None
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Проверяем соединение через простой запрос
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            break
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if db:
                try:
                    db.close()
                except:
                    pass
            db = None
            
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2  # Экспоненциальная задержка
            else:
                logger.error("Failed to establish database connection after all retries")
                raise
    
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error in request: {e}")
        if db:
            db.rollback()
        raise
    finally:
        if db:
            try:
                db.close()
            except Exception as e:
                logger.warning(f"Error closing database connection: {e}")

def check_db_connection():
    """Проверка подключения к БД"""
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False

