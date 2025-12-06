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

# Настройки пула соединений для облачных платформ
engine = create_engine(
    DATABASE_URL,
    # Пул соединений - критически важно для стабильности
    poolclass=QueuePool,
    pool_size=3,  # Количество постоянных соединений (уменьшено для бесплатного тарифа)
    max_overflow=5,  # Дополнительные соединения при нагрузке (уменьшено для бесплатного тарифа)
    pool_pre_ping=True,  # Проверка соединений перед использованием (важно для Koyeb!)
    pool_recycle=1800,  # Переподключение каждые 30 минут (меньше для стабильности)
    
    # Таймауты для подключения
    connect_args={
        "connect_timeout": 10,  # 10 секунд на подключение
    },
    
    # Дополнительные настройки
    echo=False,  # Логирование SQL запросов (отключено для production)
)

# pool_pre_ping автоматически проверяет соединения перед использованием
# Это быстрее и надежнее, чем ручная проверка

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Получение сессии БД с обработкой ошибок"""
    # pool_pre_ping уже проверяет соединение автоматически, не нужно делать это вручную
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error in request: {e}")
        db.rollback()
        raise
    finally:
        db.close()

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

